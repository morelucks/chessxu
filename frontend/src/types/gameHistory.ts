/**
 * Type definitions for game history system
 */

export type ChainType = 'stacks' | 'celo';

export type GameStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type GameResult = 'win' | 'loss' | 'draw' | undefined;

export interface GamePlayer {
  address: string;
  color: 'white' | 'black';
  isCurrentUser?: boolean;
}

export interface GameMetadata {
  gameId: number;
  chain: ChainType;
  timestamp: number;
  lastUpdated: number;
  syncedAt: number;
}

export interface GameData {
  playerW: string;
  playerB: string;
  wager: string;
  isNative: boolean;
  boardState: string;
  turn: string;
  status: GameStatus;
  winner?: GameResult;
  moveHistory?: string[];
}

export interface CachedGameFull extends GameMetadata, GameData {}

export interface SyncOptions {
  maxGames?: number;
  forceRefresh?: boolean;
  startFromId?: number;
}

export interface SyncStats {
  total: number;
  synced: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface CacheStats {
  totalGames: number;
  stacksGames: number;
  celoGames: number;
  oldestGame: number | null;
  newestGame: number | null;
  cacheSize?: number;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  ongoing: number;
  winRate: number;
}

export interface GameFilter {
  chain?: ChainType;
  status?: GameStatus;
  result?: GameResult;
  dateFrom?: number;
  dateTo?: number;
}

export interface GameSort {
  field: 'timestamp' | 'gameId' | 'status';
  order: 'asc' | 'desc';
}
