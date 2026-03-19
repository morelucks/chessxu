import { Button } from "./ui/button";
import { Loader2, Wallet, LogOut } from "lucide-react"

export function StatusBar() {
  const address = "";
  const isConnecting = false;
  const handleConnect = () => console.log("Connect to Stacks");
  const handleDisconnect = () => console.log("Disconnect from Stacks");

  const isConnected = false;
  const isLoading = isConnecting;

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-6 py-3 font-semibold transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet (Stacks)
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="px-4 py-3 border-red-400/40 hover:border-red-400/60 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}

          {address && (
            <span className="text-slate-300 font-mono text-sm bg-slate-800/50 px-3 py-1 rounded-lg">
              {formatAddress(address)}
            </span>
          )}
        </div>

        <div className="text-center md:text-right">
          <div className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-slate-300">
              Disconnected • Stacks ready
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Connect your wallet to start playing on Stacks
          </div>
        </div>
      </div>
    </div>
  )
}
