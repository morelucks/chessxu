import { ChevronRight } from "lucide-react";

interface CTASectionProps {
  onStartPlaying: () => void;
  isConnecting: boolean;
  isConnected: boolean;
}

export default function CTASection({ onStartPlaying, isConnecting, isConnected }: CTASectionProps) {

  return (
    <section className="container mx-auto px-6 py-24 max-w-6xl">
      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-purple-900/50 via-slate-900/50 to-blue-900/50 overflow-hidden p-12 md:p-16">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.3), transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold max-w-3xl mx-auto">Ready to dominate the chessboard?</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Join thousands of players competing in real-time, verifiable chess battles. Your first game is on us.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button
              onClick={onStartPlaying}
              disabled={isConnecting}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isConnecting ? "Connecting Wallet..." : isConnected ? "Get Started Free" : "Connect & Play"}
              {!isConnecting && <ChevronRight className="w-5 h-5" />}
            </button>
            <button className="px-10 py-4 rounded-lg border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition backdrop-blur-sm font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 pt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Security
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Developers</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Forums
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-white/60 text-sm">
          <p>&copy; 2025 Stark Chess. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Cookies
            </a>
          </div>
        </div>
      </footer>
    </section>
  );
}

