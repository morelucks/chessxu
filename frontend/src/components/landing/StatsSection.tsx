const stats = [
  { label: "Active Players", value: "2,847", change: "+24%" },
  { label: "Games Played", value: "45.2K", change: "+142%" },
  { label: "Average Rating", value: "1650", change: "+18%" },
  { label: "Total Prize Pool", value: "$125K", change: "+89%" },
];

export default function StatsSection() {
  return (
    <section className="container mx-auto px-6 py-24 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm hover:border-purple-500/30 transition"
          >
            <p className="text-white/60 text-sm mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-4">
              <h3 className="text-3xl md:text-4xl font-bold">{stat.value}</h3>
              <span className="text-emerald-400 text-sm font-semibold">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

