/**
 * Game History Dashboard Component
 * 
 * Displays user's game history with offline support.
 * Shows cached games and allows reviewing past matches.
 */

import { useState } from 'react';
import { useGameHistory } from '../../hooks/useGameHistory';
import { CachedGame } from '../../services/gameHistoryDB';
import { 
  Trophy, 
  Clock, 
  RefreshCw, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Calendar
} from 'lucide-react';
import './GameHistoryDashboard.css';

interface GameHistoryDashboardProps {
  onGameSelect?: (game: CachedGame) => void;
}

export default function GameHistoryDashboard({ onGameSelect }: GameHistoryDashboardProps) {
  const { 
    games, 
    loading, 
    error, 
    syncing, 
    syncProgress, 
    lastSync,
    syncNow, 
    stats 
  } = useGameHistory();

  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'draws' | 'ongoing'>('all');
  const [isOnline] = useState(navigator.onLine);

  /**
   * Filter games based on selected filter
   */
  const filteredGames = games.filter(game => {
    if (filter === 'all') return true;
    if (filter === 'ongoing') return game.status === 0 || game.status === 1;
    if (filter === 'wins') return game.winner === 'win';
    if (filter === 'losses') return game.winner === 'loss';
    if (filter === 'draws') return game.winner === 'draw';
    return true;
  });

  /**
   * Handle sync button click
   */
  const handleSync = async () => {
    if (syncing) return;
    await syncNow(false);
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (game: CachedGame) => {
    if (game.status === 0) return <span className="status-badge waiting">Waiting</span>;
    if (game.status === 1) return <span className="status-badge ongoing">Ongoing</span>;
    if (game.winner === 'win') return <span className="status-badge win">Victory</span>;
    if (game.winner === 'loss') return <span className="status-badge loss">Defeat</span>;
    if (game.winner === 'draw') return <span className="status-badge draw">Draw</span>;
    return <span className="status-badge cancelled">Cancelled</span>;
  };

  /**
   * Get result icon
   */
  const getResultIcon = (game: CachedGame) => {
    if (game.winner === 'win') return <TrendingUp className="result-icon win" size={18} />;
    if (game.winner === 'loss') return <TrendingDown className="result-icon loss" size={18} />;
    if (game.winner === 'draw') return <Minus className="result-icon draw" size={18} />;
    return <Clock className="result-icon ongoing" size={18} />;
  };

  if (loading && games.length === 0) {
    return (
      <div className="game-history-loading">
        <RefreshCw className="spin" size={32} />
        <p>Loading game history...</p>
      </div>
    );
  }

  return (
    <div className="game-history-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <Trophy size={24} />
          <h2>Game History</h2>
        </div>
        
        <div className="header-actions">
          {/* Online/Offline indicator */}
          <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sync button */}
          <button 
            className="sync-button"
            onClick={handleSync}
            disabled={syncing || !isOnline}
            title="Sync with blockchain"
          >
            <RefreshCw className={syncing ? 'spin' : ''} size={18} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Sync Progress */}
      {syncing && syncProgress && (
        <div className="sync-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(syncProgress.synced / syncProgress.total) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            Syncing {syncProgress.synced} of {syncProgress.total} games...
          </p>
        </div>
      )}

      {/* Last Sync Info */}
      {lastSync && !syncing && (
        <div className="last-sync-info">
          <Calendar size={14} />
          <span>Last synced {formatDate(lastSync)}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalGames}</div>
          <div className="stat-label">Total Games</div>
        </div>
        <div className="stat-card win">
          <div className="stat-value">{stats.wins}</div>
          <div className="stat-label">Wins</div>
        </div>
        <div className="stat-card loss">
          <div className="stat-value">{stats.losses}</div>
          <div className="stat-label">Losses</div>
        </div>
        <div className="stat-card draw">
          <div className="stat-value">{stats.draws}</div>
          <div className="stat-label">Draws</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({games.length})
        </button>
        <button 
          className={filter === 'wins' ? 'active' : ''}
          onClick={() => setFilter('wins')}
        >
          Wins ({stats.wins})
        </button>
        <button 
          className={filter === 'losses' ? 'active' : ''}
          onClick={() => setFilter('losses')}
        >
          Losses ({stats.losses})
        </button>
        <button 
          className={filter === 'draws' ? 'active' : ''}
          onClick={() => setFilter('draws')}
        >
          Draws ({stats.draws})
        </button>
        <button 
          className={filter === 'ongoing' ? 'active' : ''}
          onClick={() => setFilter('ongoing')}
        >
          Ongoing ({stats.ongoing})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Games List */}
      <div className="games-list">
        {filteredGames.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-svg-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-svg">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M12 11h.01" />
              </svg>
            </div>
            <h3>No Matches Found</h3>
            <p className="empty-state-desc">
              {filter === 'all' 
                ? 'No games recorded yet. Put your skills to the test and play a match to build your history!' 
                : `No ${filter} matches have been recorded in this category yet.`}
            </p>
            {!isOnline && (
              <p className="offline-note">
                <WifiOff size={16} />
                You're offline. Connect to sync new games.
              </p>
            )}
          </div>
        ) : (
          filteredGames.map(game => (
            <div 
              key={`${game.chain}-${game.gameId}`}
              className="game-card"
              onClick={() => onGameSelect?.(game)}
            >
              <div className="game-card-header">
                <div className="game-info">
                  {getResultIcon(game)}
                  <div className="game-details">
                    <div className="game-id">
                      Game #{game.gameId}
                    </div>
                    <div className="game-date">{formatDate(game.timestamp)}</div>
                  </div>
                </div>
                {getStatusBadge(game)}
              </div>

              <div className="game-card-body">
                <div className="players">
                  <div className="player">
                    <span className="player-label">White</span>
                    <span className="player-address">
                      {game.playerW.slice(0, 6)}...{game.playerW.slice(-4)}
                    </span>
                  </div>
                  <div className="vs">vs</div>
                  <div className="player">
                    <span className="player-label">Black</span>
                    <span className="player-address">
                      {game.playerB ? `${game.playerB.slice(0, 6)}...${game.playerB.slice(-4)}` : 'Waiting...'}
                    </span>
                  </div>
                </div>

                {game.wager !== '0' && (
                  <div className="wager-info">
                    <Trophy size={14} />
                    <span>{game.wager} {game.isNative ? 'CELO' : 'CHESS'}</span>
                  </div>
                )}
              </div>

              <div className="game-card-footer">
                <span className="view-game">
                  View Game <ChevronRight size={16} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Offline Mode Notice */}
      {!isOnline && games.length > 0 && (
        <div className="offline-notice">
          <WifiOff size={20} />
          <div>
            <strong>Offline Mode</strong>
            <p>Viewing cached games. Connect to sync latest data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
