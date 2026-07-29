import ChessGameWrapper from "../ChessGameWrapper";
import { useFreemium, UPGRADE_THRESHOLD } from "../../hooks/useFreemium";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useMiniPayAccess from "../../hooks/useMiniPayAccess";

export default function ChessScreen() {
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const address = useAppStore((state) => state.address);
  const activeChain = useAppStore((state) => state.activeChain);
  const activeGameId = useAppStore((state) => state.activeGameId);
  const { hasAccess, expiresAt, requiresAccess } = useMiniPayAccess();
  const { isOfflineMode, offlineGamesPlayed } = useFreemium();

  return (
    <div className="flex-1 min-h-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Unified Single Header Section */}
      <div className="flex-shrink-0 z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 pt-3 md:pt-4">
        <div className="w-full rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative px-3.5 py-2.5 flex flex-row items-center justify-between gap-3">
            
            {/* Left: Brand Title & Status/Free Games Counter */}
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white drop-shadow-md leading-none flex-shrink-0">
                Chessxu
              </h1>
              <div className="h-4 w-px bg-white/10 flex-shrink-0" />
              
              <div className="flex items-center gap-2 truncate">
                {isOfflineMode ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    <span>Offline Mode</span>
                    <span className="text-[10px] text-amber-400/80 font-mono font-normal hidden sm:inline">
                      ({offlineGamesPlayed}/{UPGRADE_THRESHOLD} free games)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span>Celo Network</span>
                    {address && (
                      <span className="text-[10px] text-emerald-400/80 font-mono font-normal hidden sm:inline">
                        • {address.slice(0, 4)}…{address.slice(-4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isConnected ? (
                <button
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold transition shadow-md hover:shadow-emerald-500/25 disabled:opacity-50 active:scale-95 border border-emerald-400/20 flex items-center gap-1.5"
                  onClick={() => connect()}
                  disabled={isConnecting}
                  aria-label="Connect wallet"
                >
                  <span className="text-[11px]">⚡</span>
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              ) : (
                <button
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 hover:text-red-400 text-slate-400 transition-all active:scale-95 group"
                  onClick={disconnect}
                  title="Disconnect Wallet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
              )}
              
              <button
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] active:scale-95 border border-purple-400/30 flex items-center gap-1.5"
                onClick={() => navigate("/pvp")}
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
