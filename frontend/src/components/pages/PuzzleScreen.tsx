import ChessGameWrapper from "../ChessGameWrapper";
import { useNavigate } from "react-router-dom";
import { useFreemium, UPGRADE_THRESHOLD } from "../../hooks/useFreemium";
import { useWalletAuth } from "../../hooks/useWalletAuth";

export default function PuzzleScreen() {
  const navigate = useNavigate();
  const { isOfflineMode, offlineGamesPlayed } = useFreemium();
  const { isConnected, isConnecting, connect } = useWalletAuth();

  return (
    <div className="flex-1 min-h-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Unified Single Header Section */}
      <div className="flex-shrink-0 z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 pt-3 md:pt-4">
        <div className="w-full rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative px-3.5 py-2.5 flex flex-row items-center justify-between gap-3">
            
            {/* Left: Puzzle Mode Title & Puzzle Details */}
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white drop-shadow-md leading-none flex-shrink-0">
                Puzzle Mode
              </h1>
              <div className="h-4 w-px bg-white/10 flex-shrink-0" />
              
              <div className="flex items-center gap-2 truncate">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span>Mate in 3 • White to move</span>
                  {isOfflineMode && (
                    <span className="text-[10px] text-amber-400/80 font-mono font-normal hidden sm:inline">
                      ({offlineGamesPlayed}/{UPGRADE_THRESHOLD} free plays)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isConnected && (
                <button
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 text-xs font-bold transition shadow-md hover:shadow-amber-500/25 disabled:opacity-50 active:scale-95 border border-amber-400/20 flex items-center gap-1.5"
                  onClick={() => connect()}
                  disabled={isConnecting}
                  aria-label="Connect wallet"
                >
                  <span className="text-[11px]">⚡</span>
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
              <button
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95"
                onClick={() => navigate("/")}
              >
                Back
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ChessGameWrapper isPuzzle={true} />
    </div>
  );
}
// PuzzleScreen layout memoization
