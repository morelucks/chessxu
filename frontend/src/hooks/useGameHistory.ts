/**
 * React Hook for Game History Management
 * 
 * Provides access to cached game history with automatic synchronization.
 * Works offline-first, falling back to cached data when RPC is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { gameHistoryDB, CachedGame } from '../services/gameHistoryDB';
import { gameSyncService, SyncProgress, SyncResult } from '../services/gameSyncService';
import useAppStore from '../zustand/store';

export interface UseGameHistoryReturn {
  games: CachedGame[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncProgress: SyncProgress | null;
  lastSync: number | null;
  refresh: () => Promise<void>;
  syncNow: (forceRefresh?: boolean) => Promise<SyncResult | null>;
  getGame: (gameId: number) => CachedGame | undefined;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    ongoing: number;
  };
}

export function useGameHistory(): UseGameHistoryReturn {
  const address = useAppStore(state => state.address);
  const activeChain = useAppStore(state => state.activeChain);

  const [games, setGames] = useState<CachedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);

  /**
   * Load games from cache
   */
  const loadGames = useCallback(async () => {
    if (!address) {
      setGames([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await gameHistoryDB.init();
      const cachedGames = await gameHistoryDB.getPlayerGames(address, activeChain);
      
      setGames(cachedGames);
      setLastSync(gameSyncService.lastSync);
    } catch (err) {
      console.error('Failed to load game history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [address, activeChain]);

  /**
   * Sync games from blockchain
   */
  const syncNow = useCallback(async (forceRefresh = false): Promise<SyncResult | null> => {
    if (!address || syncing) return null;

    try {
      setSyncing(true);
      setError(null);

      const result = await gameSyncService.syncPlayerGames(address, activeChain, {
        maxGames: 50,
        forceRefresh
      });

      // Reload games after sync
      await loadGames();
      
      return result;
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      return null;
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [address, activeChain, syncing, loadGames]);

  /**
   * Refresh games (reload from cache)
   */
  const refresh = useCallback(async () => {
    await loadGames();
  }, [loadGames]);

  /**
   * Get a specific game by ID
   */
  const getGame = useCallback((gameId: number): CachedGame | undefined => {
    return games.find(g => g.gameId === gameId);
  }, [games]);

  /**
   * Calculate statistics
   */
  const stats = useCallback(() => {
    if (!address) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        ongoing: 0
      };
    }

    const totalGames = games.length;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let ongoing = 0;

    games.forEach(game => {
      const isWhite = game.playerW.toLowerCase() === address.toLowerCase();
      
      if (game.status === 0 || game.status === 1) {
        ongoing++;
      } else if (game.status === 2) {
        // White wins
        if (isWhite) wins++;
        else losses++;
      } else if (game.status === 3) {
        // Black wins
        if (isWhite) losses++;
        else wins++;
      } else if (game.status === 4) {
        draws++;
      }
    });

    return {
      totalGames,
      wins,
      losses,
      draws,
      ongoing
    };
  }, [games, address]);

  /**
   * Subscribe to sync progress
   */
  useEffect(() => {
    const unsubscribe = gameSyncService.onSyncProgress((progress) => {
      setSyncProgress(progress);
    });

    return unsubscribe;
  }, []);

  /**
   * Load games on mount and when address/chain changes
   */
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  /**
   * Auto-sync on mount if needed
   */
  useEffect(() => {
    if (address && !gameSyncService.syncing) {
      gameSyncService.autoSync(address, activeChain).catch(err => {
        console.error('Auto-sync failed:', err);
      });
    }
  }, [address, activeChain]);

  return {
    games,
    loading,
    error,
    syncing,
    syncProgress,
    lastSync,
    refresh,
    syncNow,
    getGame,
    stats: stats()
  };
}

export default useGameHistory;
