import { Zap, Shield, Trophy, Cast as Zest } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant move verification. Play with confidence knowing every move is cryptographically secured.",
    image: "/chess-king.jpg",
  },
  {
    icon: Shield,
    title: "Transparent & Fair",
    description:
      "Complete on-chain transparency. No hidden mechanics. Pure skill-based competition verified by the network.",
    image: "/chess-queen.jpg",
  },
  {
    icon: Trophy,
    title: "Earn Rewards",
    description: "Win tournaments and earn tokens. Your victories are permanent achievements on the blockchain.",
    image: "/chess-rook.jpg",
  },
  {
    icon: Zest,
    title: "Global Tournament",
    description: "Compete against players worldwide. Climb the leaderboards and establish your chess legacy.",
    image: "/chess-knight.jpg",
  },
];

export default function FeatureGrid() {
  return (
    <section className="container mx-auto px-6 py-24 max-w-6xl">
      <div className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Why Choose Stark Chess?</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Experience the future of competitive gaming with blockchain-powered chess
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-8 transition transform hover:-translate-y-1 backdrop-blur-sm hover:border-purple-500/30 overflow-hidden"
              >
                <img
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-10 transition"
                />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Icon className="w-6 h-6 text-purple-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

