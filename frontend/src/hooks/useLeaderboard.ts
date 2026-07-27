import { useState, useEffect, useCallback } from 'react';
import { useStacksChess } from './useStacksChess';

export interface PlayerStatsData {
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  [key: string]: unknown;
}

export interface GlobalStatsData {
  totalGames?: number;
  activePlayers?: number;
  [key: string]: unknown;
}

export function usePlayerStats(address: string | null) {
  const { getPlayerStats, getPlayerElo, formatElo } = useStacksChess();
  const [stats, setStats] = useState<PlayerStatsData | null>(null);
  const [elo, setElo] = useState<string>('1200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [playerStats, playerElo] = await Promise.all([
        getPlayerStats(address),
        getPlayerElo(address),
      ]);
      setStats(playerStats as PlayerStatsData | null);
      setElo(formatElo(playerElo));
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj?.message || 'Failed to fetch player stats');
    } finally {
      setLoading(false);
    }
  }, [address, getPlayerStats, getPlayerElo, formatElo]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { stats, elo, loading, error, refetch: fetch };
}

export function useGlobalStats() {
  const { getGlobalStats } = useStacksChess();
  const [globalStats, setGlobalStats] = useState<GlobalStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGlobalStats();
      setGlobalStats(data as GlobalStatsData | null);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj?.message || 'Failed to fetch global stats');
    } finally {
      setLoading(false);
    }
  }, [getGlobalStats]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { globalStats, loading, error, refetch: fetch };
}
