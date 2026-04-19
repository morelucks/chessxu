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
      <div className="flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 z-10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Chessxu</h1>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {currentGameMode === 'pvc' ? 'Player vs Computer' : 'Player vs Player'}
              </span>
              {activeGameId ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-200 border border-emerald-400/20">
                  Match #{activeGameId}
                </span>
              ) : null}
            </div>
            {isConnected ? (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">
                  {activeStatus}
                </span>
              </div>
            ) : null}
            <p className="text-xs text-slate-400">
              {activeChain === 'stacks' ? 'Stacks Blockchain' : 'Celo Blockchain'}
              {address ? (
                <span className="ml-2 text-white">• {address.slice(0, 6)}…{address.slice(-4)}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isFarcaster && farcasterUser ? (
              <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/10 pr-3">
                {farcasterUser.pfpUrl && (
                   <img src={farcasterUser.pfpUrl} alt="pfp" className="w-6 h-6 rounded-full border border-indigo-400/50" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {farcasterUser.displayName || farcasterUser.username}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium leading-tight">
                    FID: {farcasterUser.fid}
                  </span>
                </div>
              </div>
            ) : (
              isConnected && (
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-white">
                    {address!.slice(0, 6)}...{address!.slice(-4)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {activeChain === 'stacks' ? 'Stacks' : 'Celo'}
                  </span>
                </div>
              )
            )}

            <div className="flex items-center gap-2">
              {!isConnected ? (
                (!isMiniPay && !isFarcaster) && (
                  <button
                    className="px-3 py-1.5 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    onClick={() => connect()}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                )
              ) : (
                <button
                  className="p-1.5 rounded-full border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition"
                  onClick={disconnect}
                  title="Disconnect"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
              )}
              <button
                className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-purple-500/20 active:scale-95"
                onClick={() => navigate("/")}
              >
                {activeGameId ? "Lobby" : "Match"}
              </button>
            </div>
          </div>
        </div>
        {activeChain === 'celo' && requiresAccess && !hasAccess ? (
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Daily Celo access is required before creating or joining a MiniPay match. Return to the lobby to unlock access with cUSD.
          </div>
        ) : null}
        {activeChain === 'celo' && hasAccess && expiresAt ? (
          <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            Daily Celo access is active until {new Date(expiresAt).toLocaleString()}.
          </div>
        ) : null}
      </div>

      {/* Main Content Area */}
      <ChessGameWrapper />
    </div>
  );
}
