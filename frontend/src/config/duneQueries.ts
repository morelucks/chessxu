/**
 * Dune Analytics Query Configuration
 *
 * Centralised registry of every Dune query used by the Chessxu analytics
 * dashboard.  Query IDs are assigned once the queries are published on
 * dune.com – set them here so the frontend embed and API service can
 * reference them in a single place.
 *
 * @see https://github.com/morelucks/chessxu/issues/163
 */

// ---------------------------------------------------------------------------
// Deployed contract addresses
// ---------------------------------------------------------------------------

export const CONTRACTS = {
  stacks: {
    deployer: 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B',
    game: 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.chessxu',
    token: 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.chessxu-token',
    leaderboard:
      'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.chessxu-leaderboard',
  },
  celo: {
    gameV1: '0xC43b25bB19a6Ccca549bb8E5C21fF0C44161EA14',
    gameV2: '0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E',
    paymaster: '', // TODO: populate after paymaster deployment
  },
} as const;

// ---------------------------------------------------------------------------
// Dune dashboard
// ---------------------------------------------------------------------------

/** Public Dune dashboard URL (set after the dashboard is published). */
export const DUNE_DASHBOARD_URL =
  'https://dune.com/chessxu/chessxu-analytics';

/**
 * Dune embed base – append the dashboard slug to get the embed URL.
 * The `?embed=true` query-param removes the Dune chrome.
 */
export const DUNE_EMBED_URL =
  'https://dune.com/embeds/chessxu/chessxu-analytics';

// ---------------------------------------------------------------------------
// Individual query definitions
// ---------------------------------------------------------------------------

export interface DuneQueryDef {
  /** Human-readable label shown in the UI. */
  label: string;
  /** Short description of what the query measures. */
  description: string;
  /** Dune query ID – set once the query is published. */
  queryId: number;
  /** Which chain(s) this query targets. */
  chain: 'stacks' | 'celo' | 'both';
  /** Dashboard section this query belongs to. */
  section:
    | 'overview'
    | 'activity'
    | 'players'
    | 'outcomes'
    | 'token_gas'
    | 'chain_comparison';
}

/**
 * All Dune queries powering the Chessxu analytics dashboard.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  After creating each query on dune.com, update the `queryId`   ║
 * ║  field here so the embed URLs and future Dune API calls work.  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
export const DUNE_QUERIES: Record<string, DuneQueryDef> = {
  // ── Overview ──────────────────────────────────────────────────────
  daily_active_games: {
    label: 'Daily Active Games',
    description:
      'Count of create-game / createGame calls per day across both chains.',
    queryId: 7844635,
    chain: 'both',
    section: 'overview',
  },
  cumulative_games: {
    label: 'Cumulative Games Created',
    description: 'Running total of games created over time.',
    queryId: 7844664,
    chain: 'both',
    section: 'overview',
  },

  // ── Activity ──────────────────────────────────────────────────────
  daily_wager_volume: {
    label: 'Daily Wager Volume',
    description:
      'Total STX / CELO wagered per day from create-game + join-game events.',
    queryId: 7844675,
    chain: 'both',
    section: 'activity',
  },
  cumulative_wager_volume: {
    label: 'Cumulative Wager Volume',
    description: 'Running total wager volume (USD equivalent).',
    queryId: 0,
    chain: 'both',
    section: 'activity',
  },

  // ── Players ───────────────────────────────────────────────────────
  unique_players: {
    label: 'Unique Players',
    description:
      'Distinct wallet addresses interacting with the contract (daily / cumulative).',
    queryId: 7844871,
    chain: 'both',
    section: 'players',
  },
  top_players: {
    label: 'Top Players by Games Played',
    description: 'Leaderboard of most active wallets.',
    queryId: 7844693,
    chain: 'both',
    section: 'players',
  },

  // ── Outcomes ──────────────────────────────────────────────────────
  game_outcomes: {
    label: 'Game Outcomes Distribution',
    description:
      'Pie chart breakdown: White Wins, Black Wins, Draw, Resign.',
    queryId: 0,
    chain: 'both',
    section: 'outcomes',
  },
  avg_wager_size: {
    label: 'Average Wager Size',
    description: 'Mean wager per game, trended over time.',
    queryId: 0,
    chain: 'both',
    section: 'outcomes',
  },

  // ── Token & Gas ───────────────────────────────────────────────────
  chess_token_transfers: {
    label: 'CHESS Token Transfers',
    description:
      'SIP-010 transfer volume for the chessxu-token contract.',
    queryId: 0,
    chain: 'stacks',
    section: 'token_gas',
  },
  paymaster_sponsorship: {
    label: 'Paymaster Sponsorship Volume',
    description: 'Gas sponsored via ChessxuPaymaster on Celo.',
    queryId: 7844709,
    chain: 'celo',
    section: 'token_gas',
  },
} as const;

// ---------------------------------------------------------------------------
// SQL templates (reference – actual queries live on dune.com)
// ---------------------------------------------------------------------------

/**
 * Raw SQL templates for each query.  These are stored here as a reference so
 * contributors can copy-paste them into Dune when setting up the dashboard
 * for the first time.  They target the public Dune tables for Stacks and Celo.
 */
export const DUNE_SQL_TEMPLATES: Record<string, string> = {
  // 1. Daily Active Games – Celo
  daily_active_games_celo: `
-- Daily Active Games (Celo)
-- Counts createGame calls per day on ChessxuV2
SELECT
  DATE_TRUNC('day', block_time) AS day,
  COUNT(*)                      AS games_created
FROM celo.transactions
WHERE "to" = 0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E
  AND bytearray_substring(data, 1, 4) = 0x6bfca566  -- createGame selector
  AND success = true
GROUP BY 1
ORDER BY 1;
  `.trim(),

  // 2. Cumulative Games – Celo
  cumulative_games_celo: `
-- Cumulative Games Created (Celo)
SELECT
  day,
  SUM(games_created) OVER (ORDER BY day) AS cumulative_games
FROM (
  SELECT
    DATE_TRUNC('day', block_time) AS day,
    COUNT(*)                      AS games_created
  FROM celo.transactions
  WHERE "to" = 0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E
    AND bytearray_substring(data, 1, 4) = 0x6bfca566  -- createGame selector
    AND success = true
  GROUP BY 1
) sub
ORDER BY 1;
  `.trim(),

  // 3. Daily Wager Volume – Celo
  daily_wager_volume_celo: `
-- Daily Wager Volume (Celo – native CELO)
SELECT
  DATE_TRUNC('day', block_time) AS day,
  SUM(value / 1e18)             AS daily_volume_celo
FROM celo.transactions
WHERE "to" = 0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E
  AND bytearray_substring(data, 1, 4) = 0x6bfca566  -- createGame selector
  AND success = true
  AND value > 0
GROUP BY 1
ORDER BY 1;
  `.trim(),

  // 4. Unique Players – Celo
  unique_players_celo: `
-- Unique Players (Celo)
SELECT
  DATE_TRUNC('day', block_time) AS day,
  COUNT(DISTINCT "from")        AS unique_players
FROM celo.transactions
WHERE "to" = 0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E
  AND success = true
GROUP BY 1
ORDER BY 1;
  `.trim(),

  // 5. Top Players – Celo
  top_players_celo: `
-- Top Players by Games Played (Celo)
SELECT
  "from"    AS player,
  COUNT(*)  AS games_played
FROM celo.transactions
WHERE "to" = 0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E
  AND success = true
GROUP BY 1
ORDER BY 2 DESC
LIMIT 25;
  `.trim(),

  // 6. Paymaster Sponsorship – Celo
  paymaster_sponsorship_celo: `
-- Paymaster Gas Sponsorship Volume (Celo)
-- Tracks UserOperations relayed through the ChessxuPaymaster
SELECT
  DATE_TRUNC('day', block_time) AS day,
  COUNT(*)                      AS sponsored_txns,
  SUM(gas_used * gas_price / 1e18) AS total_gas_sponsored_celo
FROM celo.transactions
WHERE "to" = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789  -- EntryPoint
  AND success = true
GROUP BY 1
ORDER BY 1;
  `.trim(),

  // NOTE: Stacks queries use the Hiro API / STX explorer tables on Dune.
  // The Stacks print-event schema differs from EVM logs – the SQL will
  // need to parse the contract-call events for SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.chessxu.
  // Placeholder templates are omitted here; see Dune docs for Stacks integration.
};
