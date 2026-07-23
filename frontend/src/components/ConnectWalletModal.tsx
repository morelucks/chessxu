import React from "react";
import { X, Wallet, ArrowRight, Zap } from "lucide-react";
import useAppStore from "../zustand/store";
import { useWalletAuth } from "../hooks/useWalletAuth";

export const ConnectWalletModal: React.FC = () => {
  const isConnectModalOpen = useAppStore((s) => s.isConnectModalOpen);
  const setConnectModalOpen = useAppStore((s) => s.setConnectModalOpen);
  const miniPayDetected = useAppStore((s) => s.miniPayDetected);
  const isFarcaster = useAppStore((s) => s.isFarcaster);
  const { connect } = useWalletAuth();

  // MiniPay is Celo-only — auto-select without showing the modal
  React.useEffect(() => {
    if (isConnectModalOpen && (miniPayDetected || (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay))) {
      setConnectModalOpen(false);
      connect({ chain: 'celo' });
    }
  }, [isConnectModalOpen, miniPayDetected, setConnectModalOpen, connect]);

  if (!isConnectModalOpen) return null;

  const handleSelectChain = async (chain: "stacks" | "celo" | "privy" | "farcaster") => {
    setConnectModalOpen(false);
    await connect({ chain });
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Connect Wallet</h2>
              <p className="text-[10px] text-slate-400">Choose a wallet/network to connect and play</p>
            </div>
          </div>
          <button
            onClick={() => setConnectModalOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-3">
          {/* Privy WalletConnect Option */}
          <button
            onClick={() => handleSelectChain("privy")}
            className="w-full text-left p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center justify-between group relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/25 flex items-center justify-center text-indigo-300 font-bold group-hover:scale-105 transition-transform">
                PRIVY
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  Privy WalletConnect
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                </span>
                <span className="text-[11px] text-slate-300 max-w-[240px] mt-0.5 leading-snug">
                  Fast login via WalletConnect, Email, Socials, or Embedded Wallet.
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all z-10" />
          </button>

          {/* Farcaster Option */}
          {isFarcaster && (
            <button
              onClick={() => handleSelectChain("farcaster")}
              className="w-full text-left p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all flex items-center justify-between group relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold group-hover:scale-105 transition-transform">
                  FC
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    Farcaster Wallet
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-[240px] mt-0.5 leading-snug">
                    Use your integrated Farcaster wallet or sign in.
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all z-10" />
            </button>
          )}

          {/* Stacks Option */}
          <button
            onClick={() => handleSelectChain("stacks")}
            className="w-full text-left p-4 rounded-xl border border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all flex items-center justify-between group relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/10 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;
