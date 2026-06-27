import { useNavigate } from "react-router-dom";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useAppStore from "../../zustand/store";

import { Wallet, Sword, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useStacksChess } from "../../hooks/useStacksChess";
import { useCeloChess } from "../../hooks/useCeloChess";
import useMiniPayAccess from "../../hooks/useMiniPayAccess";
import GaslessBadge from "../ui/GaslessBadge";

export default function PvPScreen() {
  const navigate = useNavigate();
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const activeChain = useAppStore((state) => state.activeChain);
  const setActiveChain = useAppStore((state) => state.setActiveChain);
  const activeGameId = useAppStore((state) => state.activeGameId);
  const setTimeControlMs = useAppStore((state) => state.setTimeControlMs);
  const miniPayDetected = useAppStore((state) => state.miniPayDetected);
  
  const stacks = useStacksChess();
  const celo = useCeloChess();
  const { cusdBalance, celoNativeBalance, expiresAt, hasAccess, isPurchasing, purchaseAccess, purchaseAccessWithCelo, requiresAccess } = useMiniPayAccess();

  // MiniPay users are always on Celo — skip daily access when gas is sponsored
  const isMiniPay = miniPayDetected || (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay);
  const effectiveRequiresAccess = isMiniPay && celo.gasSponsored ? false : requiresAccess;

  const timeControls = [
    { label: 'Unlimited', value: null },
    { label: '3+0 Bullet', value: 3 * 60 * 1000 },
    { label: '5+0 Blitz', value: 5 * 60 * 1000 },
    { label: '10+0 Rapid', value: 10 * 60 * 1000 },
  ];

  const [wager, setWager] = useState("0");
  const [idToJoin, setIdToJoin] = useState("");
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isJoiningMatch, setIsJoiningMatch] = useState(false);

  const handleCreateMatch = () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (effectiveRequiresAccess && !hasAccess) {
      return;
    }

    const parsedWager = Number.parseFloat(wager);
    setIsCreatingMatch(true);
    setTimeControlMs(selectedTime);

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

    if (effectiveRequiresAccess && !hasAccess) {
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
      <div className={`max-w-4xl mx-auto w-full space-y-6 pb-24 ${!isConnected ? 'flex-grow flex flex-col justify-center' : ''}`}>
        <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                PvP Matchmaking
            </h1>
            <p className="text-slate-400 text-sm">Create or join a game with on-chain staking</p>
            {celo.gasSponsored && activeChain === 'celo' && (
              <p className="text-emerald-400 text-xs font-medium animate-pulse mt-1">
                ✨ All game transactions are gasless — no CELO or stablecoins needed
              </p>
            )}
        </div>

        {!isConnected ? (
            <div className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Chess Battle Graphic / Icon */}
                <div className="relative flex justify-center items-center h-28 w-full">
                    <div className="absolute w-24 h-24 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative flex items-center gap-6">
                        <span className="text-5xl transform -rotate-12 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">👑</span>
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg">VS</div>
                        <span className="text-5xl transform rotate-12 filter drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">⚔️</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center space-y-6 backdrop-blur-xl w-full">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400">
                        <Wallet size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Connect Wallet to Enter Arena</h2>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto text-center">
                            Connect Celo wallet to play wagered matches, stake tokens, and build your on-chain chess reputation.
                        </p>
                    </div>
                    <button
                        onClick={() => connect()}
                        disabled={isConnecting}
                        className="w-full max-w-xs py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 w-full text-xs">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center space-y-1">
                        <span className="text-lg">💰</span>
                        <p className="font-bold text-slate-200">On-Chain Stakes</p>
                        <p className="text-slate-400 text-[10px]">Wager CELO directly in smart contracts</p>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center space-y-1">
                        <span className="text-lg">⚡</span>
                        <p className="font-bold text-slate-200">Gasless on Celo</p>
                        <p className="text-slate-400 text-[10px]">Play chess without worrying about gas fees</p>
                    </div>
                </div>
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
                        <div className="w-3 h-3 rounded-full bg-[#FCFF52]" />
                        <span className="text-sm font-medium">Celo Network</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Connected as</p>
                        <p className="text-xs font-mono text-slate-300">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                </div>


                {/* MiniPay Add Cash prompt — shown when balance is too low */}
                {isMiniPay && cusdBalance !== null && Number(cusdBalance) < 0.01 && (
                  <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Low Balance</p>
                      <p className="text-xs text-yellow-100/70 mt-1">Top up your MiniPay wallet to wager on matches.</p>
                    </div>
                    <a
                      href="https://minipay.opera.com/add_cash"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-yellow-400 px-5 py-2.5 font-bold text-black text-xs hover:bg-yellow-300 transition active:scale-95 whitespace-nowrap"
                    >
                      Add Cash
                    </a>
                  </div>
                )}

                {effectiveRequiresAccess && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Daily Access</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          Unlock Celo Match Access
                        </h3>
                        <p className="mt-2 text-emerald-100/80 text-xs">
                          Required for Celo match creation/joining. Price: {celo.network.DAILY_ACCESS_CUSD} cUSD or 0.05 CELO.
                        </p>
                        <p className="mt-2 text-[10px] text-emerald-100/70">
                          cUSD: {cusdBalance ? Number(cusdBalance).toFixed(2) : '--'} • CELO: {celoNativeBalance ? Number(celoNativeBalance).toFixed(4) : '--'}{expiresAt && hasAccess ? ` • active until ${new Date(expiresAt).toLocaleString()}` : ' • not active'}
                        </p>
                      </div>
                      {hasAccess ? (
                        <button
                          type="button"
                          disabled
                          className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black opacity-60 cursor-not-allowed text-xs"
                        >
                          Access Active
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <button
                            type="button"
                            onClick={() => purchaseAccess().catch(() => undefined)}
                            disabled={isPurchasing}
                            className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 text-xs shadow-[0_0_15px_rgba(52,211,153,0.3)] active:scale-95"
                          >
                            {isPurchasing ? 'Processing...' : 'Pay With cUSD'}
                          </button>
                          <button
                            type="button"
                            onClick={() => purchaseAccessWithCelo().catch(() => undefined)}
                            disabled={isPurchasing}
                            className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 text-xs shadow-[0_0_15px_rgba(252,255,82,0.3)] active:scale-95"
                          >
                            {isPurchasing ? 'Processing...' : 'Pay With CELO'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Game */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition flex flex-col gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                             <Sword size={24} />
                        </div>
                        <div className="flex items-center justify-between">
                             <h3 className="text-xl font-bold">Create Match</h3>
                             {celo.gasSponsored && activeChain === 'celo' && <GaslessBadge showLabel={false} size="sm" />}
                        </div>
                        <p className="text-sm text-slate-400">
                          {celo.gasSponsored && activeChain === 'celo'
                            ? "Start a zero-gas match securely on Celo. Pay only your wager amount."
                            : "Start a match with a custom wager."}
                        </p>
                        <div className="mt-2 space-y-3">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Wager (CELO)</label>
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
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Time Control</label>
                                <select 
                                    value={selectedTime === null ? "null" : selectedTime.toString()}
                                    onChange={(e) => setSelectedTime(e.target.value === "null" ? null : parseInt(e.target.value))}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition appearance-none"
                                >
                                    {timeControls.map(tc => (
                                        <option key={tc.label} value={tc.value === null ? "null" : tc.value}>{tc.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button  
                                onClick={handleCreateMatch}
                                disabled={isCreatingMatch || (effectiveRequiresAccess && !hasAccess)}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 transition disabled:opacity-60"
                            >
                                {effectiveRequiresAccess && !hasAccess
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
                        <div className="flex items-center justify-between">
                             <h3 className="text-xl font-bold">Join Match</h3>
                             {celo.gasSponsored && activeChain === 'celo' && <GaslessBadge showLabel={false} size="sm" />}
                        </div>
                        <p className="text-sm text-slate-400">
                          {celo.gasSponsored && activeChain === 'celo'
                            ? "Join an existing match. Gas fees are sponsored."
                            : "Join an existing match by ID."}
                        </p>
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
                                disabled={isJoiningMatch || !idToJoin.trim() || (effectiveRequiresAccess && !hasAccess)}
                                className="w-full py-4 border border-blue-500/50 hover:bg-blue-500/10 rounded-xl font-bold active:scale-95 transition disabled:opacity-60"
                            >
                                {effectiveRequiresAccess && !hasAccess
                                  ? "Unlock Access First"
                                  : isJoiningMatch
                                    ? "Joining..."
                                    : "Join Match"}
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={disconnect}
                    className="w-full py-3 text-xs text-slate-500 hover:text-red-400 transition"
                >
                    Disconnect Wallet
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
