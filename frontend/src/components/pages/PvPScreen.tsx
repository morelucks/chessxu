import { useNavigate } from "react-router-dom";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useAppStore from "../../zustand/store";

export default function PvPScreen() {
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect } = useWalletAuth();
  const activeChain = useAppStore((state) => state.activeChain);

  return (
    <div className="flex-grow bg-slate-950 text-white flex flex-col p-4 pt-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent text-center">
            PvP Matchmaking
        </h1>
      </div>
    </div>
  );
}
