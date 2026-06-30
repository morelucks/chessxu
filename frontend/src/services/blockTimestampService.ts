/**
 * Block Timestamp Service
 *
 * Resolves the true creation timestamp for a game by querying the underlying
 * blockchain rather than falling back to Date.now().
 *
 * Celo  – uses the Celoscan v2 API to find the `createGame` transaction for a
 *          given gameId, then reads the block timestamp from that transaction.
 *          Falls back to viem's `getBlock` if the explorer API is unavailable.
 *
 * Stacks – uses the Hiro Stacks Blockchain API to scan contract events for the
 *           `create-game` call that produced the requested gameId, then reads
 *           the `burn_block_time` field (seconds since epoch).
 */

import celoService from '../chess/services/celoService';
import { CELO_CONFIG, NETWORK } from '../chess/blockchainConstants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Celoscan v2 API base (no key required for basic account/tx queries) */
const CELOSCAN_API_BASE = 'https://api.celoscan.io/api';

/** Hiro Stacks API base URLs */
const STACKS_API_BASE =
  NETWORK === 'mainnet'
    ? 'https://api.hiro.so'
    : 'https://api.testnet.hiro.so';

/** Number of milliseconds before a cached entry expires */
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  timestamp: number; // epoch ms
  cachedAt: number;  // epoch ms
}

const cache = new Map<string, CacheEntry>();

function cacheKey(chain: 'celo' | 'stacks', gameId: number): string {
  return `${chain}:${gameId}`;
}

function getCached(chain: 'celo' | 'stacks', gameId: number): number | null {
  const entry = cache.get(cacheKey(chain, gameId));
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(cacheKey(chain, gameId));
    return null;
  }
  return entry.timestamp;
}

function setCached(chain: 'celo' | 'stacks', gameId: number, timestamp: number): void {
  cache.set(cacheKey(chain, gameId), { timestamp, cachedAt: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Celo timestamp resolution
// ---------------------------------------------------------------------------

/**
 * Fetches the block timestamp for the transaction that created a Celo game.
 *
 * Strategy:
 *  1. Query Celoscan for the normal transaction list of the contract address.
 *  2. Filter for `createGame` calls (function selector 0x2d913e35 / methodId).
 *  3. Return the `timeStamp` field (seconds) converted to milliseconds.
 *  4. If Celoscan is unreachable or returns no result, fall back to fetching
 *     the latest block timestamp from viem as a best-effort estimate.
 */
async function getCeloGameTimestamp(gameId: number): Promise<number> {
  const cached = getCached('celo', gameId);
  if (cached !== null) return cached;

  try {
    // Celoscan returns transactions in ascending order by default.
    // gameId corresponds to the Nth createGame call so we can use it
    // as an offset hint, but we need to scan all txs to find the right one.
    const url = new URL(CELOSCAN_API_BASE);
    url.searchParams.set('module', 'account');
    url.searchParams.set('action', 'txlist');
    url.searchParams.set('address', CELO_CONFIG.CONTRACT_ADDRESS);
    url.searchParams.set('startblock', '0');
    url.searchParams.set('endblock', '99999999');
    url.searchParams.set('sort', 'asc');
    url.searchParams.set('page', '1');
    // Limit to a reasonable page size; real-world games are sparse
    url.searchParams.set('offset', String(Math.min(gameId * 3, 1000)));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Celoscan HTTP ${response.status}`);

    const data = await response.json();
    if (data.status !== '1' || !Array.isArray(data.result)) {
      throw new Error('Celoscan returned no results');
    }

    // createGame selector: first 4 bytes of keccak256("createGame(uint256,bool)")
    // = 0x2d913e35  (pre-computed)
    const CREATE_GAME_SELECTOR = '0x2d913e35';
    const createGameTxs = (data.result as any[]).filter(
      (tx) => tx.input?.startsWith(CREATE_GAME_SELECTOR) && tx.isError === '0'
    );

    // gameId is 1-indexed; the Nth successful createGame tx created game N
    const tx = createGameTxs[gameId - 1];
    if (!tx) throw new Error(`No createGame tx found for gameId ${gameId}`);

    const timestampMs = Number(tx.timeStamp) * 1000;
    setCached('celo', gameId, timestampMs);
    return timestampMs;
  } catch (err) {
    console.warn(
      `[blockTimestampService] Celoscan lookup failed for Celo game ${gameId}, falling back to latest block:`,
      err
    );
  }

  // Fallback: read the latest block timestamp from the Celo node via viem.
  // This is approximate but always available without an API key.
  try {
    const block = await celoService.getPublicClient().getBlock({ blockTag: 'latest' });
    const timestampMs = Number(block.timestamp) * 1000;
    // Do NOT cache the fallback — it is not specific to this gameId
    return timestampMs;
  } catch (fallbackErr) {
    console.warn('[blockTimestampService] viem getBlock fallback failed:', fallbackErr);
    return Date.now();
  }
}

// ---------------------------------------------------------------------------
// Stacks timestamp resolution
// ---------------------------------------------------------------------------

/**
 * Stacks contract event shape returned by the Hiro API.
 * Only the fields we care about are typed here.
 */
interface StacksContractEvent {
  tx_id: string;
  event_index: number;
  event_type: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: { hex: string; repr: string };
  };
  stx_transfer_event?: unknown;
  ft_transfer_event?: unknown;
}

interface StacksContractEventsResponse {
  limit: number;
  offset: number;
  total: number;
  results: StacksContractEvent[];
}

interface StacksTransaction {
  tx_id: string;
  burn_block_time: number; // seconds since epoch
  burn_block_time_iso: string;
  tx_type: string;
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args: { name: string; repr: string }[];
  };
}

/**
 * Fetches the block timestamp for the transaction that created a Stacks game.
 *
 * Strategy:
 *  1. Query the Hiro API for contract events in descending order (newest first).
 *  2. Find all `create-game` transactions against the game contract.
 *  3. The Nth `create-game` call (ascending order) produced gameId N.
 *  4. Fetch that transaction and return its `burn_block_time` in milliseconds.
 *  5. Falls back to Date.now() on any error.
 */
async function getStacksGameTimestamp(
  gameId: number,
  contractId: string
): Promise<number> {
  const cached = getCached('stacks', gameId);
  if (cached !== null) return cached;

  try {
    // Fetch transactions for the contract; we need at least `gameId` pages
    // of create-game calls. Use a generous page size to minimise round-trips.
    const PAGE_SIZE = 50;
    let offset = 0;
    const createGameTxIds: string[] = [];

    // Scan pages until we have found enough create-game transactions
    outerLoop: while (true) {
      const url = `${STACKS_API_BASE}/extended/v1/contract/${contractId}/events?limit=${PAGE_SIZE}&offset=${offset}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Stacks API HTTP ${response.status}`);

      const data: StacksContractEventsResponse = await response.json();
      if (!data.results?.length) break;

      for (const event of data.results) {
        // Each event carries the tx_id; we will batch-fetch unique txs
        if (event.tx_id && !createGameTxIds.includes(event.tx_id)) {
          createGameTxIds.push(event.tx_id);
        }
        if (createGameTxIds.length >= gameId * 3) break outerLoop;
      }

      if (data.results.length < PAGE_SIZE) break; // last page
      offset += PAGE_SIZE;
    }

    // Fetch and inspect each unique transaction to find create-game calls
    const createGameTxs: StacksTransaction[] = [];

    for (const txId of createGameTxIds) {
      const txUrl = `${STACKS_API_BASE}/extended/v1/tx/${txId}`;
      const txResponse = await fetch(txUrl);
      if (!txResponse.ok) continue;

      const tx: StacksTransaction = await txResponse.json();
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'create-game'
      ) {
        createGameTxs.push(tx);
      }

      if (createGameTxs.length >= gameId) break;
    }

    // Sort ascending by burn_block_time so index (gameId - 1) is correct
    createGameTxs.sort((a, b) => a.burn_block_time - b.burn_block_time);

    const tx = createGameTxs[gameId - 1];
    if (!tx) throw new Error(`No create-game tx found for gameId ${gameId}`);

    const timestampMs = tx.burn_block_time * 1000;
    setCached('stacks', gameId, timestampMs);
    return timestampMs;
  } catch (err) {
    console.warn(
      `[blockTimestampService] Hiro API lookup failed for Stacks game ${gameId}:`,
      err
    );
    return Date.now();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves the true on-chain creation timestamp (epoch ms) for a game.
 *
 * @param chain     - 'celo' or 'stacks'
 * @param gameId    - Numeric game ID (1-indexed)
 * @param contractId - Required for Stacks: the fully-qualified contract ID
 *                     e.g. "SP34...DEPLOYER.chessxu-game"
 * @returns Promise resolving to epoch milliseconds, falling back to Date.now()
 */
export async function getGameBlockTimestamp(
  chain: 'celo' | 'stacks',
  gameId: number,
  contractId?: string
): Promise<number> {
  if (chain === 'celo') {
    return getCeloGameTimestamp(gameId);
  }

  if (!contractId) {
    console.warn('[blockTimestampService] contractId required for Stacks timestamp lookup');
    return Date.now();
  }

  return getStacksGameTimestamp(gameId, contractId);
}

export default { getGameBlockTimestamp, clearCache };
