import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import './TermsPage.css';

export default function TermsPage() {
  return (
    <div className="terms-page max-w-4xl mx-auto px-4 py-8 text-slate-200">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
          <Shield size={14} />
          <span>Legal & Transparency</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          Terms & Conditions
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
          Last updated: August 2026. Please read these terms carefully before engaging in PvP wagers or using Chessxu smart contracts.
        </p>
      </div>

      {/* Terms Content Sections */}
      <div className="space-y-6 text-sm leading-relaxed">
        {/* Section 1 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 mb-3 text-emerald-400 font-bold text-base">
            <FileText size={18} />
            <h2>1. Acceptance of Terms</h2>
          </div>
          <p className="text-slate-300">
            By connecting a wallet, interacting with smart contracts, or participating in matches on Chessxu, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use the application.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 mb-3 text-indigo-400 font-bold text-base">
            <Scale size={18} />
            <h2>2. On-Chain Smart Contracts & Decentralization</h2>
          </div>
          <p className="text-slate-300 mb-2">
            Chessxu operates fully via non-custodial smart contracts deployed on Celo and Stacks blockchains.
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1 text-xs">
            <li>Funds wagered in PvP matches are locked in non-custodial smart contracts.</li>
            <li>No central team or backend holds custody of player funds or private keys.</li>
            <li>All game outcomes (checkmates, forfeits, draws) are verified by on-chain state machines.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 mb-3 text-amber-400 font-bold text-base">
            <AlertTriangle size={18} />
            <h2>3. Fair Play & Anti-Cheat Policy</h2>
          </div>
          <p className="text-slate-300 mb-2">
            Chessxu strictly enforces fair play in all PvP matches to protect competitive integrity.
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1 text-xs">
            <li>External engine assistance (e.g. Stockfish, Komodo) during PvP matches is prohibited.</li>
            <li>Matches flagged with abnormal centipawn loss or engine correlation may forfeit wagered funds.</li>
            <li>Players found abusing rating exploits or match collusion will be blacklisted from leaderboards.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 mb-3 text-purple-400 font-bold text-base">
            <Lock size={18} />
            <h2>4. Disclaimers & Risk Acknowledgment</h2>
          </div>
          <p className="text-slate-300">
            Blockchain transactions are irreversible once confirmed. You acknowledge that cryptocurrency token prices fluctuate and you are responsible for any network transaction fees or gas required by your wallet provider.
          </p>
        </div>
      </div>
    </div>
  );
}
