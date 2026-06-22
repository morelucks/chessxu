/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getLatestResults } from './duneService';
import { useNotificationStore } from '../zustand/notificationStore';
import { DUNE_ALERTS_CONFIG } from '../config/duneAlerts';

// ---------------------------------------------------------------------------
// Types & Interface for Event Rows
// ---------------------------------------------------------------------------

export interface DuneEventRow {
  event_id: string; // Used for deduplication
  timestamp: string;
  type: string;
  creator?: string;
  joiner?: string;
  playerW?: string;
  playerB?: string;
  gameId?: number;
  status?: number;
  winner?: string;
  resignedPlayer?: string;
  player?: string;
  rank?: number;
  previousRank?: number;
  cumulativeVolume?: number;
  dailyCount?: number;
  previousRecord?: number;
  balance?: number;
  chain?: string;
  paused?: boolean;
  hourlyGames?: number;
  averageHourlyGames?: number;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  volume?: number;
}

// ---------------------------------------------------------------------------
// Staggered Polling Intervals (milliseconds)
// ---------------------------------------------------------------------------

export const ALERT_POLL_INTERVALS: Record<string, number> = {
  // Critical / high priority alerts checked frequently
  contract_paused: 15 * 1000,
  paymaster_balance_low: 15 * 1000,
  
  // Standard priority alerts
  game_joined: 30 * 1000,
  game_resolved: 30 * 1000,
  opponent_resigned: 30 * 1000,
  
  // Medium priority alerts
