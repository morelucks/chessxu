/**
 * Utility functions for game history management
 */

import { CachedGame } from '../services/gameHistoryDB';
import { GameStatus, GameResult, PlayerStats } from '../types/gameHistory';

/**
 * Determine game result for a player
 */
export function determinePlayerResult(
  status: GameStatus,
  isPlayerWhite: boolean
): GameResult {
  if (status === 2) return isPlayerWhite ? 'win' : 'loss'; // White wins
  if (status === 3) return isPlayerWhite ? 'loss' : 'win'; // Black wins
  if (status === 4) return 'draw';
  return undefined;
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: GameStatus): string {
  const statusMap: Record<GameStatus, string> = {
    0: 'Waiting for opponent',
    1: 'Game in progress',
    2: 'White wins',
    3: 'Black wins',
    4: 'Draw',
    5: 'Cancelled'
  };
  return statusMap[status] || 'Unknown';
}

/**
 * Get status color
 */
export function getStatusColor(status: GameStatus): string {
  const colorMap: Record<GameStatus, string> = {
    0: '#fbbf24', // yellow
    1: '#f59e0b', // orange
    2: '#22c55e', // green
    3: '#ef4444', // red
    4: '#94a3b8', // gray
    5: '#64748b'  // dark gray
  };
  return colorMap[status] || '#94a3b8';
}

/**
 * Get result color
 */
export function getResultColor(result: GameResult): string {
  if (result === 'win') return '#22c55e';
  if (result === 'loss') return '#ef4444';
  if (result === 'draw') return '#94a3b8';
  return '#f59e0b';
}

/**
 * Check if player is white
 */
export function isPlayerWhite(game: CachedGame, playerAddress: string): boolean {
  return game.playerW.toLowerCase() === playerAddress.toLowerCase();
}

/**
 * Check if player is black
 */
export function isPlayerBlack(game: CachedGame, playerAddress: string): boolean {
  return game.playerB.toLowerCase() === playerAddress.toLowerCase();
}

/**
 * Get opponent address
 */
export function getOpponentAddress(game: CachedGame, playerAddress: string): string {
  if (isPlayerWhite(game, playerAddress)) {
    return game.playerB || 'Waiting...';
  }
  return game.playerW;
}

/**
 * Get player color
 */
export function getPlayerColor(game: CachedGame, playerAddress: string): 'white' | 'black' | null {
  if (isPlayerWhite(game, playerAddress)) return 'white';
  if (isPlayerBlack(game, playerAddress)) return 'black';
  return null;
}

/**
 * Calculate player statistics from games
 */
export function calculatePlayerStats(
  games: CachedGame[],
  playerAddress: string
): PlayerStats {
  const stats: PlayerStats = {
    totalGames: games.length,
    wins: 0,
    losses: 0,
    draws: 0,
    ongoing: 0,
    winRate: 0
  };

  games.forEach(game => {
    const isWhite = isPlayerWhite(game, playerAddress);
    
    if (game.status === 0 || game.status === 1) {
      stats.ongoing++;
    } else if (game.status === 2) {
      if (isWhite) stats.wins++;
      else stats.losses++;
    } else if (game.status === 3) {
      if (isWhite) stats.losses++;
      else stats.wins++;
    } else if (game.status === 4) {
      stats.draws++;
    }
  });

  const completedGames = stats.wins + stats.losses + stats.draws;
  stats.winRate = completedGames > 0 ? (stats.wins / completedGames) * 100 : 0;

  return stats;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format address for display
 */
export function formatAddress(address: string, prefixLen = 6, suffixLen = 4): string {
  if (!address) return '—';
  if (address.length <= prefixLen + suffixLen) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Format wager amount
 */
export function formatWager(wager: string, isNative: boolean, _chain: 'stacks' | 'celo'): string {
  if (wager === '0') return 'No wager';
  
  const currency = isNative ? 'CELO' : 'CHESS';
  
  // Convert from smallest unit if needed
  const amount = parseFloat(wager);
  const displayAmount = amount > 1000000 ? (amount / 1000000).toFixed(2) : amount;
  
  return `${displayAmount} ${currency}`;
}

/**
 * Sort games by field
 */
export function sortGames(
  games: CachedGame[],
  field: 'timestamp' | 'gameId' | 'status',
  order: 'asc' | 'desc' = 'desc'
): CachedGame[] {
  return [...games].sort((a, b) => {
    let comparison = 0;
    
    if (field === 'timestamp') {
      comparison = a.timestamp - b.timestamp;
    } else if (field === 'gameId') {
      comparison = a.gameId - b.gameId;
    } else if (field === 'status') {
      comparison = a.status - b.status;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter games by criteria
 */
export function filterGames(
  games: CachedGame[],
  filters: {
    chain?: 'stacks' | 'celo';
    status?: GameStatus;
    result?: GameResult;
    playerAddress?: string;
  }
): CachedGame[] {
  return games.filter(game => {
    if (filters.chain && game.chain !== filters.chain) return false;
    if (filters.status !== undefined && game.status !== filters.status) return false;
    if (filters.result && game.winner !== filters.result) return false;
    if (filters.playerAddress) {
      const addr = filters.playerAddress.toLowerCase();
      const isPlayer = 
        game.playerW.toLowerCase() === addr ||
        game.playerB.toLowerCase() === addr;
      if (!isPlayer) return false;
    }
    return true;
  });
}

/**
 * Group games by date
 */
export function groupGamesByDate(games: CachedGame[]): Record<string, CachedGame[]> {
  const groups: Record<string, CachedGame[]> = {};
  
  games.forEach(game => {
    const date = new Date(game.timestamp);
    const dateKey = date.toLocaleDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(game);
  });
  
  return groups;
}

/**
 * Check if game is active (waiting or ongoing)
 */
export function isGameActive(game: CachedGame): boolean {
  return game.status === 0 || game.status === 1;
}

/**
 * Check if game is completed
 */
export function isGameCompleted(game: CachedGame): boolean {
  return game.status >= 2 && game.status <= 5;
}

/**
 * Get game duration estimate (if timestamps available)
 */
export function estimateGameDuration(_game: CachedGame): string | null {
  // TODO: Implement when we have start/end timestamps
  return null;
}

/**
 * Parse FEN string
 */
export function parseFEN(fen: string): {
  position: string;
  turn: string;
  castling: string;
  enPassant: string;
  halfmove: string;
  fullmove: string;
} {
  const parts = fen.split(' ');
  return {
    position: parts[0] || '',
    turn: parts[1] || 'w',
    castling: parts[2] || '-',
    enPassant: parts[3] || '-',
    halfmove: parts[4] || '0',
    fullmove: parts[5] || '1'
  };
}
