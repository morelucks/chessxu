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
    embeds: [
      {
        title: title,
        description: body,
        color: severity === 'critical' ? 16711680 : severity === 'high' ? 16753920 : 3447003,
        fields: Object.entries(details).map(([key, val]) => ({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          value: String(val),
          inline: true
        })),
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Chessxu Analytics Pipeline',
        }
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('[Webhook] Failed to POST webhook:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Dune Alert Evaluator Service
// ---------------------------------------------------------------------------

class DuneAlertService {
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private isTabActive = true;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  private handleVisibilityChange() {
    this.isTabActive = !document.hidden;
    console.log(`[DuneAlertService] Tab active state changed: ${this.isTabActive}`);
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'chessxu_notifications_updated') {
      console.log('[DuneAlertService] Notifications updated by another tab, reloading...');
      useNotificationStore.getState().loadNotifications().catch(err => {
        console.error('Failed to reload notifications on storage change:', err);
      });
    }
  }

  /**
   * Evaluates alert rules against query rows.
   */
  async evaluateAlerts(
    rows: DuneEventRow[],
    currentUserAddress: string | null,
    isAdmin = false
  ): Promise<void> {
    const store = useNotificationStore.getState();
    const currentNotifIds = new Set(store.notifications.map(n => n.id));

    for (const row of rows) {
      const { type, event_id } = row;
      const config = DUNE_ALERTS_CONFIG[type];
      if (!config) continue;

      // Deduplication: skip if we've already notified this event
      if (currentNotifIds.has(event_id)) continue;

      // 1. Alert Type Evaluation Rules
      let isTriggered = false;
      let title = config.name;
      let body = config.description;
      const details: Record<string, any> = {};

      if (type === 'game_joined' && currentUserAddress) {
        if (row.creator?.toLowerCase() === currentUserAddress.toLowerCase() &&
            row.joiner?.toLowerCase() !== currentUserAddress.toLowerCase()) {
          isTriggered = true;
          body = `Player ${row.joiner?.slice(0, 6)} joined game #${row.gameId}`;
          details.game_id = row.gameId;
          details.joiner = row.joiner;
        }
      } else if (type === 'game_resolved' && currentUserAddress) {
        if (row.playerW?.toLowerCase() === currentUserAddress.toLowerCase() ||
            row.playerB?.toLowerCase() === currentUserAddress.toLowerCase()) {
          isTriggered = true;
          const isWinner = row.winner?.toLowerCase() === currentUserAddress.toLowerCase();
          const outcomeText = row.status === 4 ? 'Draw' : isWinner ? 'You Won!' : 'You Lost';
          body = `Game #${row.gameId} resolved. Result: ${outcomeText}`;
          details.game_id = row.gameId;
          details.status = row.status;
          details.winner = row.winner;
        }
      } else if (type === 'opponent_resigned' && currentUserAddress) {
        if (row.winner?.toLowerCase() === currentUserAddress.toLowerCase()) {
          isTriggered = true;
          body = `Opponent resigned in game #${row.gameId}. You received the wager payout!`;
          details.game_id = row.gameId;
          details.resigner = row.resignedPlayer;
        }
      } else if (type === 'leaderboard_rank' && currentUserAddress) {
        if (row.player?.toLowerCase() === currentUserAddress.toLowerCase() &&
            row.rank && row.previousRank && Math.abs(row.rank - row.previousRank) >= 3) {
          isTriggered = true;
          const movedUp = row.rank < row.previousRank;
          body = `Leaderboard Rank Update: You moved ${movedUp ? 'UP' : 'DOWN'} to #${row.rank}!`;
          details.previous_rank = row.previousRank;
          details.new_rank = row.rank;
        }
      } else if (type === 'wager_milestone') {
        isTriggered = true;
        body = `Platform milestone: Cumulative wager volume has crossed $${row.cumulativeVolume?.toLocaleString()} USD!`;
        details.cumulative_volume = `$${row.cumulativeVolume?.toLocaleString()}`;
      } else if (type === 'daily_games_record') {
        if (row.dailyCount && row.previousRecord && row.dailyCount > row.previousRecord) {
          isTriggered = true;
          body = `New Daily Games Record! We set a new record with ${row.dailyCount} games played today!`;
          details.daily_count = row.dailyCount;
          details.previous_record = row.previousRecord;
        }
      } else if (type === 'paymaster_balance_low' && isAdmin) {
        if (row.balance !== undefined && row.balance < 1.0) {
          isTriggered = true;
          title = '🚨 CRITICAL: Paymaster Balance Low';
          body = `ChessxuPaymaster gas balance is down to ${row.balance} CELO. Please top it up immediately.`;
          details.current_balance = `${row.balance} CELO`;
          details.threshold = '1.0 CELO';
        }
      } else if (type === 'contract_paused' && isAdmin) {
        if (row.paused) {
          isTriggered = true;
