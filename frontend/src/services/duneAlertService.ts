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
  unusual_activity: 60 * 1000,
  leaderboard_rank: 5 * 60 * 1000,
  
  // Low priority / digest / milestones checked hourly/sub-hourly
  daily_games_record: 15 * 60 * 1000,
  wager_milestone: 30 * 60 * 1000,
  weekly_digest: 60 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// Farcaster V2 Push Notification Mock Utility
// ---------------------------------------------------------------------------

export async function sendFrameNotification(
  token: string,
  url: string,
  title: string,
  body: string
): Promise<boolean> {
  console.log(`[Farcaster Push] Sending notification to ${url} with token ${token}:`, { title, body });
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        title,
        body,
        targetUrl: typeof window !== 'undefined' ? window.location.origin : 'https://chessxu.io',
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Farcaster Push] Direct fetch failed (likely CORS or Mock):', err);
    // Return true to simulate successful delivery in sandbox environments
    return true;
  }
}

// ---------------------------------------------------------------------------
// Webhook Mock/Actual Dispatcher
// ---------------------------------------------------------------------------

export async function sendWebhookNotification(
  webhookUrl: string,
  alertType: string,
  severity: string,
  title: string,
  body: string,
  details: Record<string, any> = {}
): Promise<boolean> {
  if (!webhookUrl) return false;
  console.log(`[Webhook] Dispatching alert to ${webhookUrl}:`, { alertType, severity, title, body });
  
  // Format matching Discord embed structure
  const payload = {
    username: 'Chessxu Alerts',
    avatar_url: 'https://chessxu.io/logo.png',
