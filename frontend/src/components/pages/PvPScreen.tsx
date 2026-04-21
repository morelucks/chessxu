import { useNavigate } from "react-router-dom";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useAppStore from "../../zustand/store";

import { Wallet } from "lucide-react";

export default function PvPScreen() {
  const navigate = useNavigate();
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  const activeChain = useAppStore((state) => state.activeChain);
  const isMiniPay = useAppStore((state) => state.miniPayDetected);
  const isFarcaster = useAppStore((state) => state.isFarcaster);

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
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900/30 rounded-2xl border border-white/5">
                <p className="text-slate-400">Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            </div>
        )}
      </div>
    </div>
  );
}
