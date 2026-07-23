import ChessGameWrapper from "../ChessGameWrapper";
import { useNavigate } from "react-router-dom";
import OfflineModeBanner from "../OfflineModeBanner";
import { useFreemium } from "../../hooks/useFreemium";
import { useWalletAuth } from "../../hooks/useWalletAuth";

export default function PuzzleScreen() {
  const navigate = useNavigate();
  const { isOfflineMode, offlineGamesPlayed } = useFreemium();
  const { isConnected, isConnecting, connect } = useWalletAuth();

  return (
    <div className="flex-1 min-h-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 z-10 p-2 md:p-4 pt-3 md:pt-6">
        <div className="mx-auto max-w-[1280px] rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg overflow-hidden relative">
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative px-3 py-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black tracking-tight text-white drop-shadow-md leading-none">
                Puzzle Mode
              </h1>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Mate in 3 • White to move</span>
                  {isOfflineMode && (
                    <span className="ml-1 opacity-75 text-amber-300">
                      ({offlineGamesPlayed}/3 free plays)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isConnected && (
                <button
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 text-xs font-bold transition shadow-md hover:shadow-amber-500/25 active:scale-95 border border-amber-400/20"
                  onClick={() => connect()}
                  disabled={isConnecting}
                >
                  {isConnecting ? "..." : "Connect Wallet"}
                </button>
              )}
              <button
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95"
                onClick={() => navigate("/")}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Mode Banner */}
      <OfflineModeBanner />

      {/* Main Content Area */}
      <ChessGameWrapper isPuzzle={true} />
    </div>
  );
}
