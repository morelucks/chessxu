/**
 * useTransactionTracker
 *
 * Central hook for tracking blockchain transaction lifecycle.
 * Supports both Stacks (Hiro API WebSocket) and Celo (viem polling).
 *
 * Stages:
 *   initiated → pending → confirmed | reverted
 */

import { useCallback, useEffect, useRef } from 'react';
import useAppStore from '../zustand/store';
import {
  useTxHudStore,
  TxStage,
  TxEntry,
  RevertReason,
} from '../zustand/txHudStore';
import celoService from '../chess/services/celoService';

// ---------------------------------------------------------------------------
// Hiro WebSocket helpers
// ---------------------------------------------------------------------------

const HIRO_WS_URL = 'wss://api.hiro.so';

type HiroTxUpdate = {
  tx_id: string;
  tx_status: string;
  error?: string;
  result?: { repr?: string };
};


/**
 * Classify a Stacks abort reason into a human-readable RevertReason.
 */
function classifyStacksError(raw: string): RevertReason {
  if (/out.of.gas/i.test(raw)) return { code: 'out_of_gas', message: 'Transaction ran out of gas.' };
  if (/post.condition/i.test(raw)) return { code: 'post_condition', message: 'Post-condition check failed — the contract rejected the transfer.' };
  if (/not.your.turn/i.test(raw)) return { code: 'contract_error', message: 'It is not your turn to move.' };
  if (/game.not.active/i.test(raw)) return { code: 'contract_error', message: 'The game is no longer active.' };
  if (/not.player/i.test(raw)) return { code: 'contract_error', message: 'You are not a player in this game.' };
  if (/invalid.wager/i.test(raw)) return { code: 'contract_error', message: 'Invalid wager amount.' };
  if (/already.joined/i.test(raw)) return { code: 'contract_error', message: 'You have already joined this game.' };
  if (/game.not.found/i.test(raw)) return { code: 'contract_error', message: 'Game not found on-chain.' };
  if (/insufficient.funds/i.test(raw)) return { code: 'insufficient_funds', message: 'Insufficient funds for this transaction.' };
  return { code: 'unknown', message: raw || 'Transaction was reverted by the contract.' };
}

/**
 * Classify a Celo/EVM revert reason.
 */
function classifyEvmError(raw: string): RevertReason {
  if (/out.of.gas/i.test(raw)) return { code: 'out_of_gas', message: 'Transaction ran out of gas. Try increasing the gas limit.' };
  if (/execution.reverted/i.test(raw)) return { code: 'contract_error', message: 'Contract execution reverted. Check game state and try again.' };
  if (/insufficient.funds/i.test(raw)) return { code: 'insufficient_funds', message: 'Insufficient CELO balance for this transaction.' };
  if (/user.rejected/i.test(raw)) return { code: 'user_rejected', message: 'Transaction was rejected in your wallet.' };
  if (/nonce/i.test(raw)) return { code: 'nonce_error', message: 'Nonce mismatch — please refresh and retry.' };
  return { code: 'unknown', message: raw || 'Transaction was reverted.' };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTransactionTracker() {
  const activeChain = useAppStore((s) => s.activeChain);
  const { addTx, updateTx, removeTx } = useTxHudStore();

  // Keep a map of active WebSocket connections so we can clean them up.
  const wsRefs = useRef<Map<string, WebSocket>>(new Map());
  // Keep a map of Celo polling intervals.
  const celoPollers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // -------------------------------------------------------------------------
  // Stacks: subscribe via Hiro WebSocket
  // -------------------------------------------------------------------------
  const subscribeStacksTx = useCallback(
    (txId: string) => {
      if (wsRefs.current.has(txId)) return;

      const ws = new WebSocket(HIRO_WS_URL);

      ws.onopen = () => {
        // Subscribe to transaction updates
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'subscribe',
            params: { event: 'tx_update', tx_id: txId },
          }),
        );
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as HiroTxUpdate;
          const status = data.tx_status;

          if (!status) return;

          if (status === 'pending') {
            updateTx(txId, { stage: TxStage.Pending });
          } else if (status === 'success') {
            updateTx(txId, { stage: TxStage.Confirmed, confirmedAt: Date.now() });
            ws.close();
            wsRefs.current.delete(txId);
          } else if (
            status === 'abort_by_response' ||
            status === 'abort_by_post_condition' ||
            status === 'dropped_replace_by_fee' ||
            status === 'dropped_too_expensive' ||
            status === 'dropped_stale_garbage_collect' ||
            status === 'dropped_replace_across_fork' ||
            status === 'dropped_problematic'
          ) {
            const rawReason =
              data.result?.repr ?? data.error ?? status;
            updateTx(txId, {
              stage: TxStage.Reverted,
              revertReason: classifyStacksError(rawReason),
            });
            ws.close();
            wsRefs.current.delete(txId);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        // Fall back to HTTP polling if WS fails
        pollStacksTxHttp(txId);
        ws.close();
        wsRefs.current.delete(txId);
      };

      ws.onclose = () => {
        wsRefs.current.delete(txId);
      };

      wsRefs.current.set(txId, ws);
    },
    [updateTx],
  );

  // -------------------------------------------------------------------------
  // Stacks: HTTP polling fallback (Hiro REST API)
  // -------------------------------------------------------------------------
  const pollStacksTxHttp = useCallback(
    (txId: string, maxAttempts = 60, intervalMs = 5000) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;
        try {
          const res = await fetch(
            `https://api.hiro.so/extended/v1/tx/${txId}`,
          );
          if (!res.ok) {
            if (attempts < maxAttempts) setTimeout(poll, intervalMs);
            return;
          }
          const data = (await res.json()) as HiroTxUpdate;
          const status = data.tx_status;

          if (status === 'pending') {
            updateTx(txId, { stage: TxStage.Pending });
            if (attempts < maxAttempts) setTimeout(poll, intervalMs);
          } else if (status === 'success') {
            updateTx(txId, { stage: TxStage.Confirmed, confirmedAt: Date.now() });
          } else if (status?.startsWith('abort') || status?.startsWith('dropped')) {
            const rawReason = data.result?.repr ?? data.error ?? status;
            updateTx(txId, {
              stage: TxStage.Reverted,
              revertReason: classifyStacksError(rawReason),
            });
          } else if (attempts < maxAttempts) {
            setTimeout(poll, intervalMs);
          }
        } catch {
          if (attempts < maxAttempts) setTimeout(poll, intervalMs);
        }
      };

      setTimeout(poll, intervalMs);
    },
    [updateTx],
  );

  // -------------------------------------------------------------------------
  // Celo: poll via viem publicClient
  // -------------------------------------------------------------------------
  const subscribeCeloTx = useCallback(
    (txId: string) => {
      if (celoPollers.current.has(txId)) return;

      let attempts = 0;
      const maxAttempts = 60;
      const intervalMs = 3000;

      const poll = async () => {
        attempts++;
        try {
          const receipt = await celoService.publicClient.getTransactionReceipt({
            hash: txId as `0x${string}`,
          });

          if (receipt) {
            if (receipt.status === 'success') {
              updateTx(txId, { stage: TxStage.Confirmed, confirmedAt: Date.now() });
            } else {
              // EVM reverted
              updateTx(txId, {
                stage: TxStage.Reverted,
                revertReason: classifyEvmError('execution reverted'),
              });
            }
            clearInterval(celoPollers.current.get(txId));
            celoPollers.current.delete(txId);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          // TransactionReceiptNotFoundError is expected while pending
          if (
            !msg.includes('TransactionReceiptNotFoundError') &&
            !msg.includes('not found')
          ) {
            updateTx(txId, {
              stage: TxStage.Reverted,
              revertReason: classifyEvmError(msg),
            });
            clearInterval(celoPollers.current.get(txId));
            celoPollers.current.delete(txId);
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(celoPollers.current.get(txId));
          celoPollers.current.delete(txId);
        }
      };

      const id = setInterval(poll, intervalMs);
      celoPollers.current.set(txId, id);
      // Run immediately
      poll();
    },
    [updateTx],
  );

  // -------------------------------------------------------------------------
  // Public API: track a new transaction
  // -------------------------------------------------------------------------
  const trackTransaction = useCallback(
    (txId: string, label: string, chain?: 'stacks' | 'celo') => {
      const resolvedChain = chain ?? activeChain;

      const entry: TxEntry = {
        txId,
        label,
        chain: resolvedChain,
        stage: TxStage.Initiated,
        initiatedAt: Date.now(),
      };

      addTx(entry);

      // Move to pending after a short delay (wallet broadcast latency)
      setTimeout(() => {
        updateTx(txId, { stage: TxStage.Pending });
      }, 1500);

      if (resolvedChain === 'stacks') {
        subscribeStacksTx(txId);
      } else {
        subscribeCeloTx(txId);
      }
    },
    [activeChain, addTx, updateTx, subscribeStacksTx, subscribeCeloTx],
  );

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const wsCopy = wsRefs.current;
    const pollersCopy = celoPollers.current;
    return () => {
      wsCopy.forEach((ws) => ws.close());
      pollersCopy.forEach((id) => clearInterval(id));
    };
  }, []);

  return { trackTransaction, removeTx };
}
