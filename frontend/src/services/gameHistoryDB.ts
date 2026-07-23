/**
 * IndexedDB Service for Game History Caching
 * 
 * Provides offline-first storage for game history, allowing users to:
 * - View past games without RPC calls
 * - Review moves offline
 * - Sync automatically on app load
 */

const DB_NAME = 'ChessxuGameHistory';
const DB_VERSION = 1;
const GAMES_STORE = 'games';
const PLAYER_INDEX = 'playerIndex';
const TIMESTAMP_INDEX = 'timestampIndex';

import { ChainType } from '../zustand/store';

export interface CachedGame {
  gameId: number;
  chain: ChainType;
  playerW: string;
  playerB: string;
  wager: string;
  isNative: boolean;
  boardState: string;
  turn: string;
  status: number;
  winner?: string;
  moveHistory?: string[];
  timestamp: number;
  lastUpdated: number;
  syncedAt: number;
}

class GameHistoryDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create games object store
        if (!db.objectStoreNames.contains(GAMES_STORE)) {
          const store = db.createObjectStore(GAMES_STORE, { 
            keyPath: ['chain', 'gameId'] 
          });

          // Index for querying by player address
          store.createIndex(PLAYER_INDEX, ['playerW', 'playerB'], { 
            multiEntry: false 
          });

          // Index for querying by timestamp
          store.createIndex(TIMESTAMP_INDEX, 'timestamp', { unique: false });

          console.log('Created games object store with indexes');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  /**
   * Save a game to the cache
   */
  async saveGame(game: CachedGame): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readwrite');
      const store = transaction.objectStore(GAMES_STORE);
      
      const request = store.put({
        ...game,
        lastUpdated: Date.now(),
        syncedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save multiple games in a batch
   */
  async saveGames(games: CachedGame[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readwrite');
      const store = transaction.objectStore(GAMES_STORE);
      
      let completed = 0;
      const total = games.length;

      if (total === 0) {
        resolve();
        return;
      }

      games.forEach(game => {
        const request = store.put({
          ...game,
          lastUpdated: Date.now(),
          syncedAt: Date.now()
        });

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Get a specific game from cache
   */
  async getGame(chain: ChainType, gameId: number): Promise<CachedGame | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const request = store.get([chain, gameId]);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all games for a specific player
   */
  async getPlayerGames(playerAddress: string, chain?: 'stacks' | 'celo'): Promise<CachedGame[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readonly');
      const store = transaction.objectStore(GAMES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allGames = request.result || [];
        const filtered = allGames.filter((game: CachedGame) => {
          const matchesPlayer = 
            game.playerW.toLowerCase() === playerAddress.toLowerCase() ||
            game.playerB.toLowerCase() === playerAddress.toLowerCase();
          
          const matchesChain = !chain || game.chain === chain;
          
          return matchesPlayer && matchesChain;
        });

        // Sort by timestamp descending (newest first)
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        
        resolve(filtered);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get recent games (last N games)
   */
  async getRecentGames(limit: number = 20): Promise<CachedGame[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readonly');
      const store = transaction.objectStore(GAMES_STORE);
      const index = store.index(TIMESTAMP_INDEX);
      const request = index.openCursor(null, 'prev'); // Descending order

      const games: CachedGame[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && games.length < limit) {
          games.push(cursor.value);
          cursor.continue();
        } else {
          resolve(games);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all cached games
   */
  async getAllGames(): Promise<CachedGame[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readonly');
      const store = transaction.objectStore(GAMES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a specific game from cache
   */
  async deleteGame(chain: 'stacks' | 'celo', gameId: number): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readwrite');
      const store = transaction.objectStore(GAMES_STORE);
      const request = store.delete([chain, gameId]);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached games
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GAMES_STORE], 'readwrite');
      const store = transaction.objectStore(GAMES_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalGames: number;
    stacksGames: number;
    celoGames: number;
    oldestGame: number | null;
    newestGame: number | null;
  }> {
    const games = await this.getAllGames();
    
    const stacksGames = games.filter(g => g.chain === 'stacks').length;
    const celoGames = games.filter(g => g.chain === 'celo').length;
    
    const timestamps = games.map(g => g.timestamp).filter(t => t > 0);
    const oldestGame = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestGame = timestamps.length > 0 ? Math.max(...timestamps) : null;

    return {
      totalGames: games.length,
      stacksGames,
      celoGames,
      oldestGame,
      newestGame
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const gameHistoryDB = new GameHistoryDB();
export default gameHistoryDB;
