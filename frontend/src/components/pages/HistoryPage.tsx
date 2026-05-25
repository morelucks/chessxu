/**
 * History Page Component
 * 
 * Main page for viewing game history with offline support.
 * Integrates GameHistoryDashboard and GameViewer components.
 */

import { useState } from 'react';
import GameHistoryDashboard from '../GameHistory/GameHistoryDashboard';
import GameViewer from '../GameHistory/GameViewer';
import { CachedGame } from '../../services/gameHistoryDB';
import './HistoryPage.css';

export default function HistoryPage() {
  const [selectedGame, setSelectedGame] = useState<CachedGame | null>(null);

  /**
   * Handle game selection
   */
  const handleGameSelect = (game: CachedGame) => {
    setSelectedGame(game);
  };

  /**
   * Handle close game viewer
   */
  const handleCloseViewer = () => {
    setSelectedGame(null);
  };

  return (
    <div className="history-page">
      {selectedGame ? (
        <GameViewer 
          game={selectedGame} 
          onClose={handleCloseViewer}
        />
      ) : (
        <GameHistoryDashboard 
          onGameSelect={handleGameSelect}
        />
      )}
    </div>
  );
}
