/**
 * TxCard
 *
 * A single transaction card inside the HUD.
 * Shows the stepper, label, chain badge, explorer link,
 * and — on revert — the reason + recovery tips.
 */

import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { TxEntry, TxStage, RECOVERY_TIPS } from '../../../zustand/txHudStore';
import { TxStepper } from './TxStepper';

interface TxCardProps {
  tx: TxEntry;
  onDismiss: (txId: string) => void;
}

function explorerUrl(tx: TxEntry): string | null {
  if (!tx.txId) return null;
  return `https://celoscan.io/tx/${tx.txId}`;
}

function elapsed(from: number): string {
  const secs = Math.floor((Date.now() - from) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function chainLabel(chain: 'stacks' | 'celo' | 'privy'): string {
  if (chain === 'celo') return 'Celo';
  if (chain === 'privy') return 'Privy';
  return 'Stacks';
}

function chainColor(chain: 'stacks' | 'celo' | 'privy'): string {
  if (chain === 'celo') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  if (chain === 'privy') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
}

function stageBorderColor(stage: TxStage): string {
  switch (stage) {
    case TxStage.Confirmed:
      return 'border-emerald-500/30';
    case TxStage.Reverted:
      return 'border-red-500/30';
    case TxStage.Pending:
}

export const TxCard: React.FC<TxCardProps> = ({ tx, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(tx.stage === TxStage.Reverted);

  const url = explorerUrl(tx);
  const tips =
    tx.revertReason ? RECOVERY_TIPS[tx.revertReason.code] : [];

  const handleCopy = () => {
    if (!tx.txId) return;
    navigator.clipboard.writeText(tx.txId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <article
      className={`relative flex flex-col gap-3 p-4 rounded-xl border bg-slate-900/80 backdrop-blur-md shadow-xl transition-all duration-300 ${stageBorderColor(tx.stage)}`}
      aria-label={`Transaction: ${tx.label}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-bold text-white truncate">{tx.label}</span>
          <span className="text-[10px] text-slate-500">{elapsed(tx.initiatedAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${chainColor(tx.chain)}`}
          >
            {chainLabel(tx.chain)}
          </span>
          <button
            onClick={() => onDismiss(tx.txId)}
            className="text-slate-500 hover:text-white transition-colors p-0.5 rounded"
            aria-label="Dismiss transaction"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <TxStepper stage={tx.stage} />

      {/* Revert reason */}
      {tx.stage === TxStage.Reverted && tx.revertReason && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
            <RefreshCw size={12} />
            {tx.revertReason.message}
          </p>

          {tips.length > 0 && (
            <div>
              <button
                onClick={() => setTipsOpen((o) => !o)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                aria-expanded={tipsOpen}
              >
                <Lightbulb size={11} />
                Recovery tips
                {tipsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>

              {tipsOpen && (
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-[11px] text-slate-300">
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer: copy + explorer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <button
          onClick={handleCopy}
          disabled={!tx.txId}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5 disabled:opacity-40"
          aria-label="Copy transaction ID"
        >
          <Copy size={11} />
          {copied ? 'Copied!' : 'Copy ID'}
        </button>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
            aria-label="View on block explorer"
          >
            Explorer
            <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-[11px] text-slate-600 px-2">Awaiting tx</span>
        )}
      </div>
    </article>
  );
};
