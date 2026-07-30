/**
 * Game History Dashboard Component
 * 
 * Displays user's game history with offline support.
 * Shows cached games and allows reviewing past matches.
 */

import { useState, useMemo } from 'react';
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
  Calendar,
  Search,
  X,
  Filter,
  Coins,
  RotateCcw
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
  const [searchQuery, setSearchQuery] = useState('');
  const [wagerFilter, setWagerFilter] = useState<'all' | 'free' | 'wagered'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [isOnline] = useState(navigator.onLine);

  const hasActiveFilters = searchQuery !== '' || filter !== 'all' || wagerFilter !== 'all' || dateFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setFilter('all');
    setWagerFilter('all');
    setDateFilter('all');
  };

  /**
   * Filter games based on search, outcome, wager, and date range
   */
  const filteredGames = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();

    return games.filter(game => {
      // Outcome filter
      if (filter === 'ongoing' && !(game.status === 0 || game.status === 1)) return false;
      if (filter === 'wins' && game.winner !== 'win') return false;
      if (filter === 'losses' && game.winner !== 'loss') return false;
      if (filter === 'draws' && game.winner !== 'draw') return false;

      // Wager filter
      const isFree = !game.wager || game.wager === '0' || game.wager === '0.0';
      if (wagerFilter === 'free' && !isFree) return false;
      if (wagerFilter === 'wagered' && isFree) return false;

      // Date range filter
      if (dateFilter === '24h' && now - game.timestamp > 86400000) return false;
      if (dateFilter === '7d' && now - game.timestamp > 7 * 86400000) return false;
      if (dateFilter === '30d' && now - game.timestamp > 30 * 86400000) return false;

      // Search query (by Game ID or Opponent address)
      if (query) {
        const gameIdStr = game.gameId.toString();
        const matchesId = gameIdStr === query || gameIdStr.includes(query);
        const matchesWhite = game.playerW.toLowerCase().includes(query);
        const matchesBlack = (game.playerB || '').toLowerCase().includes(query);
        if (!matchesId && !matchesWhite && !matchesBlack) return false;
      }

      return true;
    });
  }, [games, filter, wagerFilter, dateFilter, searchQuery]);

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

      {/* Filter & Search Bar */}
      <div className="history-filter-panel">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by game ID or opponent address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="filter-dropdowns">
          <div className="filter-group">
            <Coins size={14} className="filter-icon" />
            <select 
              value={wagerFilter} 
              onChange={(e) => setWagerFilter(e.target.value as 'all' | 'free' | 'wagered')}
              className="filter-select"
            >
              <option value="all">All Stakes</option>
              <option value="free">Free Games ($0)</option>
              <option value="wagered">Wagered (&gt; $0)</option>
            </select>
          </div>

          <div className="filter-group">
            <Calendar size={14} className="filter-icon" />
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value as 'all' | '24h' | '7d' | '30d')}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="reset-filters-btn" onClick={resetFilters} title="Reset all filters">
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Results Count */}
      <div className="filter-tabs-container">
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

        {hasActiveFilters && (
          <div className="results-count-badge">
            <Filter size={12} />
            Showing {filteredGames.length} of {games.length} games
          </div>
        )}
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
              <Search size={32} className="empty-state-svg" />
            </div>
            <h3>No Matches Found</h3>
            <p className="empty-state-desc">
              {hasActiveFilters
                ? 'No games match your current filter and search criteria. Try adjusting your search query or reset filters.'
                : filter === 'all' 
                ? 'No games recorded yet. Put your skills to the test and play a match to build your history!' 
                : `No ${filter} matches have been recorded in this category yet.`}
            </p>
            {hasActiveFilters && (
              <button className="reset-filters-empty-btn" onClick={resetFilters}>
                <RotateCcw size={14} />
                Clear Filters & Search
              </button>
            )}
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
