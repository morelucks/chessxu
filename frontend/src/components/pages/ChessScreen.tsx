// Import the chess components
import ChessGameWrapper from "../ChessGameWrapper";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useMiniPayAccess from "../../hooks/useMiniPayAccess";

export default function ChessScreen() {
  const isMiniPay = typeof window !== 'undefined' && ((window as any).ethereum?.isMiniPay || (window as any).provider?.isMiniPay);
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const address = useAppStore((state) => state.address);
  const activeChain = useAppStore((state) => state.activeChain);
  const activeGameId = useAppStore((state) => state.activeGameId);
  const isFarcaster = useAppStore((state) => state.isFarcaster);
  const { hasAccess, expiresAt, requiresAccess } = useMiniPayAccess();

  // Alternate between Celo and Stacks when not connected to show multi-chain support
  const [displayChain, setDisplayChain] = useState(activeChain);

  useEffect(() => {
    if (isConnected) {
      setDisplayChain(activeChain);
      return;
    }
    const interval = setInterval(() => {
      setDisplayChain((prev) => prev === 'celo' ? 'stacks' : 'celo');
    }, 1000); // 1 second
    return () => clearInterval(interval);
  }, [isConnected, activeChain]);

  return (
    <div className="flex-grow bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 z-10 p-4 pt-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg overflow-hidden relative">
          {/* Subtle glow effects inside the banner */}
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative px-3 py-2 flex flex-row items-center justify-between">
            
            {/* Left Section: Compact Title & Status */}
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black tracking-tight text-white drop-shadow-md leading-none">
                Chessxu
              </h1>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-300 font-medium flex items-center gap-1.5 transition-all duration-500">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${displayChain === 'celo' ? 'bg-[#FCFF52]' : 'bg-[#F7821B]'}`} />
                  <span className="min-w-[65px] transition-all duration-500">{displayChain === 'stacks' ? 'Stacks' : 'Celo'} Network</span>
                  {address && <span className="ml-0.5 opacity-60 font-mono hidden sm:inline">• {address.slice(0, 4)}…</span>}
                </div>
              </div>
            </div>

            {/* Right Section: Actions Only */}
            <div className="flex items-center gap-2">
              {!isConnected ? (
                (!isMiniPay && !isFarcaster) && (
                  <button
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold transition shadow-md hover:shadow-emerald-500/25 disabled:opacity-50 active:scale-95 border border-emerald-400/20"
                    onClick={() => connect()}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "..." : "Connect"}
                  </button>
                )
              ) : (
                <button
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 hover:text-red-400 text-slate-400 transition-all active:scale-95 group"
                  onClick={disconnect}
                  title="Disconnect"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
              )}
              
              <button
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] active:scale-95 border border-purple-400/30 flex items-center gap-1"
                onClick={() => navigate("/")}
              >
                <span className="text-[12px] leading-none">⚔️</span>
                {activeGameId ? "Lobby" : "Match"}
              </button>
            </div>
            
          </div>
          
          {/* Celo Access Messages */}
          {(activeChain === 'celo' && requiresAccess && !hasAccess) || (activeChain === 'celo' && hasAccess && expiresAt) ? (
            <div className="bg-black/20 border-t border-white/5 px-2 py-1 flex items-center justify-center text-center">
              {requiresAccess && !hasAccess ? (
                <div className="text-[9px] text-amber-200/90 font-medium">
                  ⚠️ Daily Celo access required for MiniPay. Return to lobby.
                </div>
              ) : (
                <div className="text-[9px] text-emerald-300/90 font-medium flex items-center gap-1">
                  <span className="flex h-1 w-1 rounded-full bg-emerald-400" />
                  Access Active
                </div>
              )}
            </div>
          ) : null}
          
        </div>
      </div>

      {/* Main Content Area */}
      <ChessGameWrapper />
    </div>
  );
}
