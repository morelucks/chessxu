/**
 * TxHud
 *
 * The main Transaction Status HUD panel.
 * Renders as a collapsible overlay anchored to the bottom-right corner.
 * Shows a badge with the count of active (non-terminal) transactions.
 */

import React from 'react';
import { Activity, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useTxHudStore, TxStage } from '../../../zustand/txHudStore';
import { TxCard } from './TxCard';

export const TxHud: React.FC = () => {
  const { transactions, isOpen, setOpen, removeTx, clearCompleted } =
    useTxHudStore();

  if (transactions.length === 0) return null;

  const activeTxCount = transactions.filter(
    (tx) =>
      tx.stage === TxStage.Initiated || tx.stage === TxStage.Pending,
  ).length;

  const hasCompleted = transactions.some(
    (tx) =>
      tx.stage === TxStage.Confirmed || tx.stage === TxStage.Reverted,
  );

  return (
    <div
      className="fixed bottom-24 right-4 z-50 w-80 flex flex-col gap-2 md:bottom-6"
      role="region"
      aria-label="Transaction status HUD"
      aria-live="polite"
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className="self-end flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 border border-white/10 backdrop-blur-md shadow-xl hover:bg-slate-700/90 transition-all text-sm font-semibold text-white"
        aria-expanded={isOpen}
        aria-controls="tx-hud-panel"
      >
        <Activity size={15} className={activeTxCount > 0 ? 'text-blue-400 animate-pulse' : 'text-slate-400'} />
        <span>Transactions</span>
        {activeTxCount > 0 && (
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-[10px] font-bold text-white"
            aria-label={`${activeTxCount} active`}
          >
            {activeTxCount}
          </span>
        )}
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          id="tx-hud-panel"
          className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-0.5"
        >
          {/* Clear completed button */}
          {hasCompleted && (
            <button
              onClick={clearCompleted}
              className="self-end flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              aria-label="Clear completed transactions"
            >
              <Trash2 size={11} />
              Clear completed
            </button>
          )}

          {transactions.map((tx) => (
            <TxCard key={tx.txId} tx={tx} onDismiss={removeTx} />
          ))}
        </div>
      )}
    </div>
  );
};
