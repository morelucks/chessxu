// Import the chess components
import ChessGameWrapper from "../ChessGameWrapper";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import { useGameState } from "../../chess/hooks/useGameState";
import { GAME_STATUS } from "../../chess/blockchainConstants";
import useMiniPayAccess from "../../hooks/useMiniPayAccess";

function getStatusLabel(status: number | null | undefined) {
  switch (status) {
    case GAME_STATUS.WAITING:
      return "Waiting for Opponent";
    case GAME_STATUS.ONGOING:
      return "On-Chain Match Live";
    case GAME_STATUS.WHITE_WINS:
      return "White Won";
    case GAME_STATUS.BLACK_WINS:
      return "Black Won";
    case GAME_STATUS.DRAW:
      return "Draw";
    case GAME_STATUS.CANCELLED:
      return "Cancelled";
    default:
      return "Local Board Ready";
  }
}

export default function ChessScreen() {
  const isMiniPay = typeof window !== 'undefined' && ((window as any).ethereum?.isMiniPay || (window as any).provider?.isMiniPay);
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const address = useAppStore((state) => state.address);
  const activeChain = useAppStore((state) => state.activeChain);
  const activeGameId = useAppStore((state) => state.activeGameId);
  const isFarcaster = useAppStore((state) => state.isFarcaster);
  const farcasterUser = useAppStore((state) => state.farcasterUser);
  const { hasAccess, expiresAt, requiresAccess } = useMiniPayAccess();
  const { gameState } = useGameState(activeGameId);
  const [currentGameMode, setCurrentGameMode] = useState('pvc');

  useEffect(() => {
    const handleStorageChange = () => {
      const gameMode = localStorage.getItem('currentGameMode') || 'pvc';
      setCurrentGameMode(gameMode);
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const activeStatus =
    gameState && typeof gameState === "object" && "status" in gameState
      ? getStatusLabel(Number((gameState as { status: number | string }).status))
      : getStatusLabel(null);

  return (
    <div className="flex-grow bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 z-10 p-4 pt-6">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          {/* Subtle glow effects inside the banner */}
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left Section: Title & Status */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                  Chessxu
                </h1>
                <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  {currentGameMode === 'pvc' ? 'PvC Mode' : 'PvP Mode'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-slate-200 font-semibold tracking-wide">
                  {activeStatus}
                </span>
                {activeGameId && (
                  <span className="text-emerald-400 font-bold ml-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs border border-emerald-500/20">#{activeGameId}</span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${activeChain === 'celo' ? 'bg-[#FCFF52]' : 'bg-[#F7821B]'}`} />
                {activeChain === 'stacks' ? 'Stacks' : 'Celo'} Network
                {address && <span className="ml-1 opacity-60 font-mono text-[10px]">• {address.slice(0, 6)}…{address.slice(-4)}</span>}
              </div>
            </div>

            {/* Right Section: Actions Only */}
            <div className="flex items-center gap-2">
              {!isConnected ? (
                (!isMiniPay && !isFarcaster) && (
                  <button
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold transition shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 active:scale-95 border border-emerald-400/20"
                    onClick={() => connect()}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "..." : "Connect"}
                  </button>
                )
              ) : (
                <button
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 hover:text-red-400 text-slate-400 transition-all active:scale-95 group"
                  onClick={disconnect}
                  title="Disconnect"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
              )}
              
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-95 border border-purple-400/30 flex items-center gap-1.5"
                onClick={() => navigate("/")}
              >
                <span className="text-[16px] leading-none -mt-0.5">⚔️</span>
                {activeGameId ? "Lobby" : "Match"}
              </button>
            </div>
            
          </div>
          
          {/* Celo Access Messages */}
          {(activeChain === 'celo' && requiresAccess && !hasAccess) || (activeChain === 'celo' && hasAccess && expiresAt) ? (
            <div className="bg-black/20 border-t border-white/5 px-4 py-2.5 flex items-center justify-center text-center">
              {requiresAccess && !hasAccess ? (
                <div className="text-[11px] text-amber-200/90 font-medium">
                  ⚠️ Daily Celo access required for MiniPay matches. Return to lobby to unlock.
                </div>
              ) : (
                <div className="text-[11px] text-emerald-300/90 font-medium flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Celo Access Active until {new Date(expiresAt!).toLocaleTimeString()}
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
