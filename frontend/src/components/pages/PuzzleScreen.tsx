import ChessGameWrapper from "../ChessGameWrapper";
import { useNavigate } from "react-router-dom";

export default function PuzzleScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex-grow bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 z-10 p-4 pt-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg overflow-hidden relative">
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative px-3 py-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black tracking-tight text-white drop-shadow-md leading-none">
                Puzzle Mode
              </h1>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-300 font-medium">
                  Mate in 3 • White to move
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95"
                onClick={() => navigate("/")}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ChessGameWrapper isPuzzle={true} />
    </div>
  );
}
