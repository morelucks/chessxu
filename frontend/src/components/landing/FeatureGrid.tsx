import { Swords, Bot, Puzzle, Trophy, Zap, ArrowRight, Shield, Coins } from "lucide-react";

// ─── Game Modes ───
const gameModes = [
  {
    icon: Swords,
    title: "Player vs Player",
    description: "Challenge real opponents in ranked matches. Wager CELO or cUSD and the winner takes the pot.",
    accent: "from-purple-500 to-indigo-500",
    border: "hover:border-purple-500/40",
    tag: "Ranked",
  },
  {
    icon: Bot,
    title: "Play vs AI",
    description: "Train against Stockfish AI at any difficulty. No wallet needed — jump straight into a game.",
    accent: "from-blue-500 to-cyan-500",
    border: "hover:border-blue-500/40",
    tag: "Free",
  },
  {
    icon: Puzzle,
    title: "Daily Puzzles",
    description: "Solve tactical puzzles to sharpen your skills. New challenges every day with ELO tracking.",
    accent: "from-emerald-500 to-teal-500",
    border: "hover:border-emerald-500/40",
    tag: "Daily",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Climb the global ELO rankings. Your wins, losses, and rating are recorded on-chain forever.",
    accent: "from-amber-500 to-orange-500",
    border: "hover:border-amber-500/40",
    tag: "On-Chain",
  },
];

// ─── How Wagering Works steps ───
const wagerSteps = [
  {
    step: "1",
    icon: Coins,
    title: "Stake",
    description: "Choose your wager amount in CELO or cUSD. As little as $0.10 to start.",
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    step: "2",
    icon: Swords,
    title: "Play",
    description: "Get matched with an opponent at your skill level. Every move is verified on-chain.",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    step: "3",
    icon: Trophy,
    title: "Win & Earn",
    description: "Win the match and claim the pot instantly. Funds settle directly to your wallet.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export default function FeatureGrid() {
  return (
    <section className="container mx-auto px-6 py-24 max-w-6xl space-y-28">
      {/* ── How It Works (Wagering Flow) ── */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-300 font-medium">
            <Zap className="w-3.5 h-3.5" />
            Zero gas fees on every game
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Three steps from your wallet to your first win. No complicated setup — just chess.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wagerSteps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="relative">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm h-full flex flex-col items-center text-center space-y-4 hover:bg-white/10 transition group">
                  {/* Step number */}
                  <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition`}>
                    <Icon className={`w-7 h-7 ${s.accent}`} />
                  </div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{s.description}</p>
                </div>
                {/* Arrow connector (not on last) */}
                {idx < wagerSteps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Verified on-chain
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Gasless via MiniPay
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            cUSD / CELO wagers
          </div>
        </div>
      </div>

      {/* ── Game Modes ── */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Choose Your Arena</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Four ways to play — from casual practice to high-stakes ranked matches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gameModes.map((mode, idx) => {
            const Icon = mode.icon;
            return (
              <div
                key={idx}
                className={`group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-8 transition transform hover:-translate-y-1 backdrop-blur-sm ${mode.border} relative overflow-hidden`}
              >
                {/* Glow effect */}
                <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${mode.accent} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity`} />

                <div className="relative z-10 flex items-start gap-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.accent} bg-opacity-20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{mode.title}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${mode.accent} text-white`}>
                        {mode.tag}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">{mode.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
