/**
 * Game Viewer Component
 * 
 * Allows users to review past games offline.
 * Displays board state and move history from cached data.
 */

import { useState } from 'react';
import { CachedGame } from '../../services/gameHistoryDB';
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward,
  Trophy,
  Clock
} from 'lucide-react';
import './GameViewer.css';

interface GameViewerProps {
  game: CachedGame;
  onClose?: () => void;
}

export default function GameViewer({ game, onClose }: GameViewerProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [boardState, setBoardState] = useState(game.boardState);

  /**
   * Parse FEN to get board position
   */
  const parseFEN = (fen: string) => {
    const parts = fen.split(' ');
    const position = parts[0];
    const turn = parts[1];
    
    return { position, turn };
  };

  /**
   * Get game status text
   */
  const getStatusText = () => {
    if (game.status === 0) return 'Waiting for opponent';
    if (game.status === 1) return 'Game in progress';
    if (game.status === 2) return 'White wins';
    if (game.status === 3) return 'Black wins';
    if (game.status === 4) return 'Draw';
    if (game.status === 5) return 'Cancelled';
    return 'Unknown';
  };

  /**
   * Get result color
   */
  const getResultColor = () => {
    if (game.winner === 'win') return '#22c55e';
    if (game.winner === 'loss') return '#ef4444';
    if (game.winner === 'draw') return '#94a3b8';
    return '#f59e0b';
  };

  /**
   * Navigate to first move
   */
  const goToStart = () => {
    setCurrentMoveIndex(0);
    // TODO: Reset board to initial position
  };

  /**
   * Navigate to previous move
   */
  const goToPrevious = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      // TODO: Update board state
    }
  };

  /**
   * Navigate to next move
   */
  const goToNext = () => {
    const maxMoves = game.moveHistory?.length || 0;
    if (currentMoveIndex < maxMoves) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      // TODO: Update board state
    }
  };

  /**
   * Navigate to last move
   */
  const goToEnd = () => {
    const maxMoves = game.moveHistory?.length || 0;
    setCurrentMoveIndex(maxMoves);
    setBoardState(game.boardState);
  };

  const { turn } = parseFEN(boardState);

  return (
    <div className="game-viewer">
      <div className="game-viewer-header">
        <button className="back-button" onClick={onClose}>
          <ChevronLeft size={20} />
          Back to History
        </button>
        
        <div className="game-title">
          <Trophy size={20} />
          <span>Game #{game.gameId}</span>
        </div>
      </div>

      <div className="game-viewer-content">
        {/* Game Info Panel */}
        <div className="game-info-panel">
          <div className="info-section">
            <h3>Game Details</h3>
            
            <div className="info-row">
              <span className="info-label">Status</span>
              <span 
                className="info-value status"
                style={{ color: getResultColor() }}
              >
                {getStatusText()}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Chain</span>
              <span className="info-value">CELO</span>
            </div>

            {game.wager !== '0' && (
              <div className="info-row">
                <span className="info-label">Wager</span>
                <span className="info-value">
                  {game.wager} {game.isNative ? 'CELO' : 'CHESS'}
                </span>
              </div>
            )}

            <div className="info-row">
              <span className="info-label">Turn</span>
              <span className="info-value">{turn === 'w' ? 'White' : 'Black'}</span>
            </div>
          </div>

          <div className="info-section">
            <h3>Players</h3>
            
            <div className="player-info">
              <div className="player-color white">⚪</div>
              <div className="player-details">
                <span className="player-label">White</span>
                <span className="player-address">
                  {game.playerW.slice(0, 8)}...{game.playerW.slice(-6)}
                </span>
              </div>
            </div>

            <div className="player-info">
              <div className="player-color black">⚫</div>
              <div className="player-details">
                <span className="player-label">Black</span>
                <span className="player-address">
                  {game.playerB 
                    ? `${game.playerB.slice(0, 8)}...${game.playerB.slice(-6)}`
                    : 'Waiting for opponent...'}
                </span>
              </div>
            </div>
          </div>

          {game.moveHistory && game.moveHistory.length > 0 && (
            <div className="info-section">
              <h3>Move History</h3>
              <div className="move-list">
                {game.moveHistory.map((move, index) => (
                  <div 
                    key={index}
                    className={`move-item ${index === currentMoveIndex ? 'active' : ''}`}
                    onClick={() => setCurrentMoveIndex(index)}
                  >
                    <span className="move-number">{index + 1}.</span>
                    <span className="move-notation">{move}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Board Display */}
        <div className="board-panel">
          <div className="board-container">
            <div className="board-placeholder">
              <div className="fen-display">
                <h4>Board State (FEN)</h4>
                <code>{boardState}</code>
              </div>
              <p className="board-note">
                Board visualization coming soon. 
                Current position is shown in FEN notation above.
              </p>
            </div>
          </div>

          {/* Move Navigation Controls */}
          <div className="move-controls">
            <button 
              className="control-button"
              onClick={goToStart}
              disabled={currentMoveIndex === 0}
              title="Go to start"
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              className="control-button"
              onClick={goToPrevious}
              disabled={currentMoveIndex === 0}
              title="Previous move"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="move-counter">
              <span className="current-move">{currentMoveIndex}</span>
              <span className="move-separator">/</span>
              <span className="total-moves">{game.moveHistory?.length || 0}</span>
            </div>

            <button 
              className="control-button"
              onClick={goToNext}
              disabled={currentMoveIndex >= (game.moveHistory?.length || 0)}
              title="Next move"
            >
              <ChevronRight size={20} />
            </button>

            <button 
              className="control-button"
              onClick={goToEnd}
              disabled={currentMoveIndex >= (game.moveHistory?.length || 0)}
              title="Go to end"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Offline Indicator */}
      {!navigator.onLine && (
        <div className="offline-indicator">
          <Clock size={16} />
          <span>Viewing cached game data (offline)</span>
        </div>
      )}
    </div>
  );
}
