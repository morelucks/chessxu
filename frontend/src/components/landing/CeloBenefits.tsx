import { Zap, Coins, Smartphone, Clock, Shield, Leaf } from "lucide-react";

const celoBenefits = [
  {
    icon: Zap,
    title: "Zero Gas Fees",
    description: "Every game, wager, and transaction is completely gasless. Play without ever worrying about network fees.",
    accent: "from-emerald-500 to-teal-500",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Coins,
    title: "cUSD & cEUR Wagers",
    description: "Bet with stablecoins pegged to real currencies. No volatile swings — what you wager is what you play for.",
    accent: "from-yellow-500 to-amber-500",
    iconColor: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Smartphone,
    title: "MiniPay Native",
    description: "Designed for MiniPay from the ground up. One-tap access, instant wallet connect, and seamless mobile play.",
    accent: "from-blue-500 to-indigo-500",
    iconColor: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Clock,
    title: "Instant Settlement",
    description: "Winnings arrive in your wallet the moment the game ends. Sub-second finality on Celo — no waiting.",
    accent: "from-purple-500 to-violet-500",
    iconColor: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "On-Chain Verified",
    description: "Every move, outcome, and payout is recorded on the Celo blockchain. Fully transparent and tamper-proof.",
    accent: "from-cyan-500 to-sky-500",
    iconColor: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Leaf,
    title: "Carbon Negative",
    description: "Celo offsets more carbon than it produces. Play chess and support a sustainable blockchain ecosystem.",
    accent: "from-lime-500 to-green-500",
    iconColor: "text-lime-400",
    bg: "bg-lime-500/10",
  },
];

export default function CeloBenefits() {
  return (
    <section className="container mx-auto px-6 py-24 max-w-6xl">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-900">C</span>
            </div>
            <span className="text-sm text-emerald-300 font-medium">Built on Celo</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Why{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Celo
            </span>
            ?
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            The fastest, cheapest, and most accessible blockchain for gaming.
            Play from MiniPay with zero setup and zero fees.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {celoBenefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="group rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] p-7 transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm hover:border-emerald-500/20 relative overflow-hidden"
              >
                {/* Subtle glow on hover */}
                <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${benefit.accent} opacity-0 group-hover:opacity-[0.06] rounded-full blur-2xl transition-opacity duration-300`} />

                <div className="relative z-10 space-y-4">
                  <div className={`w-11 h-11 rounded-xl ${benefit.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="text-base font-bold text-white">{benefit.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-8 md:p-10 text-center space-y-4">
          <p className="text-white/70 text-base max-w-2xl mx-auto leading-relaxed">
            <span className="text-emerald-400 font-semibold">MiniPay users:</span>{" "}
            Open Chessxu directly from your wallet — no browser needed, no gas fees ever.
            Your first game is one tap away.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-white/40">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8">ERC-20 compatible</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8">Sub-second finality</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8">Mobile-first design</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8">Carbon negative</span>
          </div>
        </div>
      </div>
    </section>
  );
}
