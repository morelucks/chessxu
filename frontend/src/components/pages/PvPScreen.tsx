import { useNavigate } from "react-router-dom";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useAppStore from "../../zustand/store";

import { Wallet, Sword, Users } from "lucide-react";
import { useState } from "react";
import { useStacksChess } from "../../hooks/useStacksChess";
import { useCeloChess } from "../../hooks/useCeloChess";
import useMiniPayAccess from "../../hooks/useMiniPayAccess";

export default function PvPScreen() {
  const navigate = useNavigate();
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const activeChain = useAppStore((state) => state.activeChain);
  const activeGameId = useAppStore((state) => state.activeGameId);
  const isMiniPay = useAppStore((state) => state.miniPayDetected);
  const isFarcaster = useAppStore((state) => state.isFarcaster);
  
  const stacks = useStacksChess();
  const celo = useCeloChess();
  const { cusdBalance, expiresAt, hasAccess, isPurchasing, purchaseAccess, requiresAccess } = useMiniPayAccess();

  const [wager, setWager] = useState("0");
  const [idToJoin, setIdToJoin] = useState("");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isJoiningMatch, setIsJoiningMatch] = useState(false);

  const handleCreateMatch = () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (activeChain === 'celo' && requiresAccess && !hasAccess) {
      return;
    }

    const parsedWager = Number.parseFloat(wager);
    setIsCreatingMatch(true);

    if (activeChain === 'celo') {
      celo.createGame(wager, true)
        .then(() => {
          setIsCreatingMatch(false);
          navigate("/");
        })
        .catch(() => setIsCreatingMatch(false));
    } else {
      const wagerMicroStx = Number.isFinite(parsedWager) && parsedWager > 0 ? Math.floor(parsedWager * 1_000_000) : 0;
      stacks.createGame(wagerMicroStx, true)
        .then(() => {
          setIsCreatingMatch(false);
          navigate("/");
        })
        .catch(() => setIsCreatingMatch(false));
    }
  };

  const handleJoinMatch = () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (activeChain === 'celo' && requiresAccess && !hasAccess) {
      return;
    }

    const gameId = Number.parseInt(idToJoin, 10);
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return;
    }

    setIsJoiningMatch(true);
    
    if (activeChain === 'celo') {
      celo.joinGame(gameId, "0", true)
        .then(() => {
          setIsJoiningMatch(false);
          navigate("/");
        })
        .catch(() => setIsJoiningMatch(false));
    } else {
      stacks.joinGame(gameId, 0, true)
        .then(() => {
          setIsJoiningMatch(false);
          navigate("/");
        })
        .catch(() => setIsJoiningMatch(false));
    }
  };

  return (
    <div className="flex-grow bg-slate-950 text-white flex flex-col p-4 pt-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-24">
        <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                PvP Matchmaking
            </h1>
            <p className="text-slate-400 text-sm">Create or join a game with on-chain staking</p>
        </div>

        {!isConnected ? (
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center space-y-6 backdrop-blur-xl">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400">
                    <Wallet size={32} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">Wallet Required</h2>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">
                        Connect your wallet to create or join on-chain matches and stake tokens.
                    </p>
                </div>
                <button
                    onClick={() => connect()}
                    disabled={isConnecting}
                    className="w-full max-w-xs py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
                >
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
            </div>
        ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Active Match Banner */}
                {activeGameId ? (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex items-center justify-between">
                    <span>Active match detected: <b>#{activeGameId}</b></span>
                    <button 
                        onClick={() => navigate("/")}
                        className="text-xs bg-emerald-500 text-black px-3 py-1 rounded-lg font-bold"
                    >
                        Resume
                    </button>
                  </div>
                ) : null}

                {/* Network Status & Access */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${activeChain === 'celo' ? 'bg-[#FCFF52]' : 'bg-[#F7821B]'}`} />
                        <span className="text-sm font-medium">{activeChain === 'stacks' ? 'Stacks' : 'Celo'} Network</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Connected as</p>
                        <p className="text-xs font-mono text-slate-300">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                </div>

                {activeChain === 'celo' && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Daily Access</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Unlock Celo match access</h3>
                        <p className="mt-2 text-emerald-100/80 text-xs">
                          Required for Celo match creation/joining. Price: {celo.network.DAILY_ACCESS_CUSD} cUSD.
                        </p>
                        <p className="mt-2 text-[10px] text-emerald-100/70">
                          cUSD balance: {cusdBalance ? Number(cusdBalance).toFixed(2) : '--'}
                          {expiresAt && hasAccess ? ` • active until ${new Date(expiresAt).toLocaleString()}` : ' • not active'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => purchaseAccess().catch(() => undefined)}
                        disabled={isPurchasing || hasAccess}
                        className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 text-xs"
                      >
                        {hasAccess ? 'Access Active' : isPurchasing ? 'Processing...' : 'Pay With cUSD'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Game */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition flex flex-col gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                             <Sword size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Create Match</h3>
                            <p className="text-sm text-slate-400">Start a match with a custom wager.</p>
                        </div>
                        <div className="mt-2 space-y-3">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Wager ({activeChain === 'stacks' ? 'STX' : 'CELO'})</label>
                                <input 
                                    type="number" 
                                    value={wager}
                                    min="0"
                                    step="0.1"
                                    onChange={(e) => setWager(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    placeholder="0.0"
                                />
                            </div>
                            <button 
                                onClick={handleCreateMatch}
                                disabled={isCreatingMatch || (activeChain === 'celo' && requiresAccess && !hasAccess)}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 transition disabled:opacity-60"
                            >
                                {activeChain === 'celo' && requiresAccess && !hasAccess
                                  ? "Unlock Access First"
                                  : isCreatingMatch
                                    ? "Broadcasting..."
                                    : "Create Game"}
                            </button>
                        </div>
                    </div>

                    {/* Join Game */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition flex flex-col gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                             <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Join Match</h3>
                            <p className="text-sm text-slate-400">Join an existing match by ID.</p>
                        </div>
                        <div className="mt-2 space-y-3">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Game ID</label>
                                <input 
                                    type="text"
                                    value={idToJoin}
                                    onChange={(e) => setIdToJoin(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="Match ID"
                                />
                            </div>
                            <button 
                                onClick={handleJoinMatch}
                                disabled={isJoiningMatch || !idToJoin.trim() || (activeChain === 'celo' && requiresAccess && !hasAccess)}
                                className="w-full py-4 border border-blue-500/50 hover:bg-blue-500/10 rounded-xl font-bold active:scale-95 transition disabled:opacity-60"
                            >
                                {activeChain === 'celo' && requiresAccess && !hasAccess
                                  ? "Unlock Access First"
                                  : isJoiningMatch
                                    ? "Joining..."
                                    : "Join Match"}
                            </button>
                        </div>
                    </div>
                </div>
                {(!isMiniPay && !isFarcaster) && (
                    <button
                        onClick={disconnect}
                        className="w-full py-3 text-xs text-slate-500 hover:text-red-400 transition"
                    >
                        Disconnect Wallet
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
