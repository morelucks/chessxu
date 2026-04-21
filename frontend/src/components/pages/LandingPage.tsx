import HeroSection from "../landing/HeroSection";
import FeatureGrid from "../landing/FeatureGrid";
import StatsSection from "../landing/StatsSection";
import CTASection from "../landing/CTASection";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useWalletAuth } from "../../hooks/useWalletAuth";
import useAppStore from "../../zustand/store";

export default function LandingPage() {
  const isMiniPay = useAppStore((state) => state.miniPayDetected);
  const isFarcaster = useAppStore((state) => state.isFarcaster);
  const navigate = useNavigate();
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletAuth();
  
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] = useState(false);

  useEffect(() => {
    if (isConnected && shouldNavigateAfterConnect) {
      setShouldNavigateAfterConnect(false);
      navigate("/");
    }
    if (isConnected && isFarcaster) {
      navigate("/");
    }
  }, [isConnected, shouldNavigateAfterConnect, isFarcaster, navigate]);

  const handleStartPlaying = () => {
    if (isConnected) {
      navigate("/");
      return;
    }

    setShouldNavigateAfterConnect(true);
    connect();
  };

  return (
    <div className="flex-grow bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Chess hero background image */}
        <img
          src="/chess-hero-bg.jpg"
          alt="Chess background"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.4), transparent 40%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.3), transparent 45%), radial-gradient(circle at 50% 80%, rgba(236,72,153,0.25), transparent 50%)",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 max-w-6xl flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ♟ Chessxu
          </div>
          {/* Mobile Connect Button */}
          {(!isMiniPay && !isFarcaster) && (
            <div className="md:hidden">
              {isConnected ? (
                <button
                  onClick={handleStartPlaying}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold text-sm transition"
                >
                  Play
                </button>
              ) : (
                <button
                  onClick={handleStartPlaying}
                  disabled={isConnecting}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "..." : "Connect"}
                </button>
              )}
            </div>
          )}
          <div className="hidden md:flex gap-8 items-center text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#" className="hover:text-white transition">
              About
            </a>
            <a href="#" className="hover:text-white transition">
              Docs
            </a>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-200">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={handleStartPlaying}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition"
                >
                  Play Now
                </button>
                {(!isMiniPay && !isFarcaster) && (
                  <button
                    onClick={disconnect}
                    className="px-3 py-2 rounded border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition text-xs"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ) : (
              (!isMiniPay && !isFarcaster) && (
                <button
                  onClick={handleStartPlaying}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "Connecting..." : "Connect & Play"}
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative pt-24 pb-20">
        <HeroSection onStartPlaying={handleStartPlaying} isConnecting={isConnecting} isConnected={isConnected} />
        
        {/* On-chain controls have been moved to /pvp (PvPScreen) */}

        <div id="features">
          <FeatureGrid />
        </div>
        <StatsSection />
        <CTASection onStartPlaying={handleStartPlaying} isConnecting={isConnecting} isConnected={isConnected} />
      </main>
    </div>
  );
}
