import { ChevronRight } from "lucide-react";

interface HeroSectionProps {
  onStartPlaying: () => void;
  isConnecting: boolean;
  isConnected: boolean;
}

export default function HeroSection({ onStartPlaying, isConnecting, isConnected }: HeroSectionProps) {
  return (
    <section className="container mx-auto px-6 py-24 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-purple-200">On-chain gameplay • Starknet powered</span>
          </div>

          {/* Main headline */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                The Ultimate Decentralized
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Chess Experience
              </span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
              Challenge players globally in verifiable, on-chain chess battles. Every move recorded permanently on
              Starknet. Prove your mastery. Claim your legacy.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button
              onClick={onStartPlaying}
              disabled={isConnecting}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isConnecting ? "Connecting Wallet..." : isConnected ? "Start Playing Now" : "StarkChess"}
              {!isConnecting && <ChevronRight className="w-5 h-5" />}
            </button>
            <button className="px-8 py-4 rounded-lg border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition backdrop-blur-sm font-semibold">
              Join & Earn
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 pt-8 text-sm text-white/60">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span>+ players already in the arena</span>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-6 h-full items-center">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
              <img src="/chess-king.jpg" alt="Chess King" className="w-full h-48 object-cover rounded-lg" />
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
              <img src="/chess-knight.jpg" alt="Chess Knight" className="w-full h-48 object-cover rounded-lg" />
            </div>
          </div>
          <div className="space-y-6 mt-12">
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
              <img src="/chess-queen.jpg" alt="Chess Queen" className="w-full h-48 object-cover rounded-lg" />
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
              <img src="/chess-rook.jpg" alt="Chess Rook" className="w-full h-48 object-cover rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

