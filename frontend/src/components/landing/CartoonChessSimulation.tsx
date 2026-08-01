import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Zap, Sparkles, Trophy, Cpu, Wand2 } from 'lucide-react';
import './CartoonChessSimulation.css';

// Sequence of moves for a famous fast tactical match (Opera Game variation)
const gameMoves = [
  { from: 28, to: 36, piece: '♙', san: '1. e4', whiteSpeech: "Opening with 1. e4! Italian Gambit ♟️", blackSpeech: "Classic center control!" },
  { from: 52, to: 44, piece: '♟', san: '1... e5', whiteSpeech: "Controlling the board...", blackSpeech: "Countering with 1... e5! 🛡️" },
  { from: 6, to: 21, piece: '♘', san: '2. Nf3', whiteSpeech: "Developing Knight to f3! 🐴", blackSpeech: "Pressuring e5..." },
  { from: 57, to: 42, piece: '♞', san: '2... Nc6', whiteSpeech: "Targeting e5 pawn...", blackSpeech: "Defending Knight to c6! ⚡" },
  { from: 5, to: 26, piece: '♗', san: '3. Bc4', whiteSpeech: "Italian Game: Bishop to c4! 🇮🇹", blackSpeech: "Eyes on f7 weak point..." },
  { from: 61, to: 34, piece: '♝', san: '3... Bc5', whiteSpeech: "Symmetric bishop placement!", blackSpeech: "Italian Bishop to c5! ✨" },
  { from: 1, to: 18, piece: '♘', san: '4. Nc3', whiteSpeech: "Four Knights line active!", blackSpeech: "Gasless tx confirmed on Celo! 💫" },
  { from: 62, to: 45, piece: '♞', san: '4... Nf6', whiteSpeech: "Calculated 4.2M moves/sec 🧠", blackSpeech: "Developing Knight to f6! 🧙‍♂️" },
  { from: 3, to: 27, piece: '♕', san: '5. d4', whiteSpeech: "Striking open the center! 💥", blackSpeech: "Center pawn break!" },
  { from: 44, to: 35, piece: '♟', san: '5... exd4', whiteSpeech: "Pawn trade in center!", blackSpeech: "Captures 5... exd4! ⚔️" },
  { from: 21, to: 35, piece: '♘', san: '6. Nxd4', whiteSpeech: "Knight retakes on d4! 🐴", blackSpeech: "Intense tactical skirmish!" },
  { from: 34, to: 27, piece: '♝', san: '6... Bxd4', whiteSpeech: "Bishop trade in center!", blackSpeech: "Bishop captures d4! 🪄" },
  { from: 3, to: 35, piece: '♕', san: '7. Qxd4', whiteSpeech: "Queen centralization! 👑", blackSpeech: "Queen dominates d4!" },
  { from: 51, to: 43, piece: '♟', san: '7... d6', whiteSpeech: "Preparing attack...", blackSpeech: "Solidifying d6 pawn line! 🛡️" },
  { from: 2, to: 29, piece: '♗', san: '8. Bg5', whiteSpeech: "Pinning the f6 knight! 🎯", blackSpeech: "Nasty pin on f6..." },
  { from: 35, to: 59, piece: '♕', san: '9. Nd5!', whiteSpeech: "Triple attack on f6! ⚡", blackSpeech: "Calculated checkmate tactic!" },
  { from: 45, to: 28, piece: '♞', san: '9... Nxd5', whiteSpeech: "Sacrifice accepted!", blackSpeech: "Knight counters d5! 🔮" },
  { from: 29, to: 58, piece: '♗', san: '10. Bxd8#', whiteSpeech: "CHECKMATE! Queen Mate! 🏆👑", blackSpeech: "GG WP! Brilliant tactic! 🔥" }
];

// Initial board piece placement (compact 64 square indices)
const initialBoard = [
  '♖','♘','♗','♕','♔','♗','♘','♖',
  '♙','♙','♙','♙','♙','♙','♙','♙',
  '','','','','','','','',
  '','','','','','','','',
  '','','','','','','','',
  '','','','','','','','',
  '♟','♟','♟','♟','♟','♟','♟','♟',
  '♜','♞','♝','♛','♚','♝','♞','♜'
];

export default function CartoonChessSimulation() {
  const navigate = useNavigate();
  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [board, setBoard] = useState<string[]>(initialBoard);
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(null);
  const [evalBar, setEvalBar] = useState(50); // 50% = equal
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);

  // Current speech bubbles
  const currentMove = gameMoves[moveIndex] || gameMoves[0];
  const [whiteSpeech, setWhiteSpeech] = useState(gameMoves[0].whiteSpeech);
  const [blackSpeech, setBlackSpeech] = useState(gameMoves[0].blackSpeech);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play next move in simulation
  const nextMove = () => {
    setMoveIndex((prev) => {
      const nextIdx = (prev + 1) % gameMoves.length;
      if (nextIdx === 0) {
        // Reset board at end of loop
        setBoard([...initialBoard]);
        setLastMove(null);
        setEvalBar(50);
        setCapturedWhite([]);
        setCapturedBlack([]);
        setWhiteSpeech("New match starting! ♟️");
        setBlackSpeech("Good luck, King Bot! ⚡");
        return 0;
      }

      const move = gameMoves[nextIdx];
      setBoard((currentBoard) => {
        const newBoard = [...currentBoard];
        const captured = newBoard[move.to];
        if (captured) {
          if (['♙','♘','♗','♖','♕','♔'].includes(captured)) {
            setCapturedWhite((prev) => [...prev, captured]);
          } else {
            setCapturedBlack((prev) => [...prev, captured]);
          }
        }
        newBoard[move.to] = newBoard[move.from];
        newBoard[move.from] = '';
        return newBoard;
      });

      setLastMove({ from: move.from, to: move.to });
      setWhiteSpeech(move.whiteSpeech);
      setBlackSpeech(move.blackSpeech);
      setEvalBar(Math.min(90, Math.max(10, 50 + (nextIdx - 5) * 4)));
      return nextIdx;
    });
  };

  // Automated game loop timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalTime = 2400 / speed;
    timerRef.current = setInterval(nextMove, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const handleReset = () => {
    setBoard([...initialBoard]);
    setMoveIndex(0);
    setLastMove(null);
    setEvalBar(50);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setWhiteSpeech(gameMoves[0].whiteSpeech);
    setBlackSpeech(gameMoves[0].blackSpeech);
  };

  return (
    <div className="cartoon-sim-wrapper">
      {/* Background Glow */}
      <div className="cartoon-sim-glow glow-top" />
      <div className="cartoon-sim-glow glow-bottom" />

      <div className="cartoon-sim-container">
        {/* Live Status Header Badge */}
        <div className="sim-header-bar">
          <div className="live-status-pill">
            <span className="live-dot" />
            <span className="live-text">LIVE BOT ARENA</span>
            <span className="live-mode-tag">Paymaster Sponsored</span>
          </div>

          <div className="sim-controls">
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="sim-ctrl-btn" 
              title={isPlaying ? "Pause Match" : "Play Match"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            </button>
            <button 
              onClick={handleReset} 
              className="sim-ctrl-btn" 
              title="Restart Match"
            >
              <RotateCcw size={15} />
            </button>
            <div className="speed-selector">
              {([1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`speed-btn ${speed === s ? 'active' : ''}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cartoon Characters Arena Row */}
        <div className="cartoon-arena">
          {/* Left / Black Player Avatar: Wizard GM */}
          <div className="avatar-card black-avatar">
            <div className="avatar-speech-bubble bubble-left">
              <span>{blackSpeech}</span>
            </div>
            <div className="avatar-img-frame">
              <img src="/avatars/wizard-gm.png" alt="Grandmaster Wizard" className="avatar-img" />
              <div className="avatar-level-badge black-badge">
                <Wand2 size={12} />
                <span>Wizard GM • 1850</span>
              </div>
            </div>
            {capturedWhite.length > 0 && (
              <div className="captured-pieces-row">
                {capturedWhite.map((p, i) => <span key={i} className="captured-piece">{p}</span>)}
              </div>
            )}
          </div>

          {/* Center 3D Interactive Floating Chessboard */}
          <div className="floating-board-wrapper">
            {/* Advantage Eval Bar */}
            <div className="eval-bar-track">
              <div className="eval-bar-fill" style={{ height: `${evalBar}%` }} />
            </div>

            <div className="chess-board-3d">
              {board.map((piece, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const isDark = (row + col) % 2 === 1;
                const isHighlighted = lastMove && (lastMove.from === i || lastMove.to === i);
                const isBlackPiece = ['♟','♜','♞','♝','♛','♚'].includes(piece);

                return (
                  <div
                    key={i}
                    className={`board-sq ${isDark ? 'sq-dark' : 'sq-light'} ${isHighlighted ? 'sq-active' : ''}`}
                  >
                    {piece && (
                      <span className={`sq-piece-symbol ${isBlackPiece ? 'piece-black-color' : 'piece-white-color'} ${isHighlighted ? 'piece-pop' : ''}`}>
                        {piece}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live Notation Overlay */}
            <div className="move-notation-overlay">
              <span className="san-tag">{currentMove.san}</span>
              <span className="move-count-tag">Move {moveIndex + 1}/{gameMoves.length}</span>
            </div>
          </div>

          {/* Right / White Player Avatar: King Bot */}
          <div className="avatar-card white-avatar">
            <div className="avatar-speech-bubble bubble-right">
              <span>{whiteSpeech}</span>
            </div>
            <div className="avatar-img-frame">
              <img src="/avatars/bot-king.png" alt="King Bot" className="avatar-img" />
              <div className="avatar-level-badge white-badge">
                <Cpu size={12} />
                <span>King Bot 🤖 • 1920</span>
              </div>
            </div>
            {capturedBlack.length > 0 && (
              <div className="captured-pieces-row">
                {capturedBlack.map((p, i) => <span key={i} className="captured-piece">{p}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Quick Play Banner */}
        <div className="sim-footer-cta">
          <div className="cta-text-group">
            <Sparkles size={18} className="cta-sparkle-icon" />
            <span>Ready to test your tactics? Play free vs AI or wager cUSD in PvP arenas!</span>
          </div>
          <button onClick={() => navigate('/')} className="sim-play-now-btn">
            <Zap size={16} />
            <span>Play Match Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// Cartoon match container setup
