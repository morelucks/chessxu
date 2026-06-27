/**
 * txHudStore
 *
 * Zustand store for the Transaction Status HUD.
 * Tracks all in-flight and recently completed transactions.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum TxStage {
  Initiated = 'initiated',
  Pending = 'pending',
  Confirmed = 'confirmed',
  Reverted = 'reverted',
}

export interface RevertReason {
  /** Machine-readable code */
  code:
    | 'out_of_gas'
    | 'post_condition'
    | 'contract_error'
    | 'insufficient_funds'
    | 'user_rejected'
    | 'nonce_error'
    | 'unknown';
  /** Human-readable message */
  message: string;
}

export interface TxEntry {
  txId: string;
  /** Short description shown in the HUD (e.g. "Create Game", "Submit Move") */
  label: string;
  chain: 'stacks' | 'celo';
  stage: TxStage;
  initiatedAt: number;
  confirmedAt?: number;
  revertReason?: RevertReason;
}

// ---------------------------------------------------------------------------
// Recovery tips per revert code
// ---------------------------------------------------------------------------

export const RECOVERY_TIPS: Record<RevertReason['code'], string[]> = {
  out_of_gas: [
    'Retry the transaction — gas limits are estimated automatically.',
    'If the issue persists, try again in a few minutes when the network is less congested.',
  ],
  post_condition: [
    'The contract rejected the token transfer. Ensure your balance is sufficient.',
    'Check that you are sending the correct token (CELO vs CHESS).',
  ],
  contract_error: [
    'Refresh the page and check the current game state before retrying.',
    'Another player may have already acted — verify the game status.',
  ],
  insufficient_funds: [
    'Top up your wallet balance and try again.',
    'Reduce the wager amount to match your available balance.',
  ],
  user_rejected: [
    'You cancelled the transaction in your wallet. Click the action button to try again.',
  ],
  nonce_error: [
    'Refresh the page to reset your wallet nonce and retry.',
    'If using MetaMask, try resetting the account nonce in Settings → Advanced.',
  ],
  unknown: [
    'Try the action again. If the problem persists, check the explorer for details.',
    'Ensure your wallet is connected to the correct network.',
  ],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface TxHudState {
  transactions: TxEntry[];
  /** Whether the HUD panel is expanded */
  isOpen: boolean;

  addTx: (entry: TxEntry) => void;
  updateTx: (txId: string, updates: Partial<TxEntry>) => void;
  removeTx: (txId: string) => void;
  clearCompleted: () => void;
  setOpen: (open: boolean) => void;
}

export const useTxHudStore = create<TxHudState>((set) => ({
  transactions: [],
  isOpen: false,

  addTx: (entry) =>
    set((state) => ({
      transactions: [entry, ...state.transactions].slice(0, 20), // cap at 20
      isOpen: true, // auto-open when a new tx arrives
    })),

  updateTx: (txId, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.txId === txId ? { ...tx, ...updates } : tx,
      ),
    })),

  removeTx: (txId) =>
    set((state) => ({
      transactions: state.transactions.filter((tx) => tx.txId !== txId),
    })),

  clearCompleted: () =>
    set((state) => ({
      transactions: state.transactions.filter(
        (tx) =>
          tx.stage !== TxStage.Confirmed && tx.stage !== TxStage.Reverted,
      ),
    })),

  setOpen: (isOpen) => set({ isOpen }),
}));
