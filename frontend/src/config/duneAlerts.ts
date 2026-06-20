/**
 * Dune Analytics Alerts & Notifications Configuration
 *
 * Defines the alert thresholds, severity levels, default channels,
 * and Dune query configurations for the real-time alerting pipeline.
 *
 * @see https://github.com/morelucks/chessxu/issues/164
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type NotificationChannel = 'in_app' | 'farcaster_push' | 'webhook';

export interface AlertDefinition {
  id: string;
  name: string;
  description: string;
  queryId: number;
  defaultSeverity: AlertSeverity;
  defaultChannels: NotificationChannel[];
  triggerCondition: string;
}

export const DUNE_ALERTS_CONFIG: Record<string, AlertDefinition> = {
  game_joined: {
    id: 'game_joined',
    name: 'Game Joined',
    description: 'Alert sent when another player joins a game created by the user.',
    queryId: 101, // Mock query ID for joins
    defaultSeverity: 'high',
    defaultChannels: ['in_app', 'farcaster_push'],
    triggerCondition: 'New join-game event where creator matches current user',
  },
  game_resolved: {
    id: 'game_resolved',
    name: 'Game Resolved',
    description: 'Alert sent when a game the user participated in has been completed or resolved.',
    queryId: 102, // Mock query ID for resolutions
    defaultSeverity: 'high',
    defaultChannels: ['in_app', 'farcaster_push'],
    triggerCondition: 'Game status changes to 2 (White wins), 3 (Black wins), 4 (Draw), or 5 (Cancelled)',
  },
  opponent_resigned: {
    id: 'opponent_resigned',
    name: 'Opponent Resigned',
    description: 'Alert sent when an opponent resigns, granting the user a win.',
    queryId: 103, // Mock query ID for resignations
    defaultSeverity: 'medium',
    defaultChannels: ['in_app'],
    triggerCondition: 'Opponent calls resign and user is declared winner',
  },
  leaderboard_rank: {
    id: 'leaderboard_rank',
    name: 'Leaderboard Rank Change',
    description: 'Alert sent when user moves up or down by 3 or more positions on the leaderboard.',
    queryId: 104, // Mock query ID for leaderboard changes
    defaultSeverity: 'medium',
    defaultChannels: ['in_app'],
    triggerCondition: 'Rank delta >= 3 or <= -3',
  },
  wager_milestone: {
    id: 'wager_milestone',
    name: 'Wager Milestone',
    description: 'Broadcast to all users when cumulative platform wager volume crosses thresholds ($1k, $5k, $10k, $50k, $100k).',
    queryId: 105,
    defaultSeverity: 'low',
    defaultChannels: ['in_app'],
    triggerCondition: 'Wager volume crosses milestone thresholds',
  },
  daily_games_record: {
    id: 'daily_games_record',
    name: 'Daily Games Record',
    description: 'Broadcast to all users when daily game count exceeds the previous all-time high.',
    queryId: 106,
    defaultSeverity: 'low',
    defaultChannels: ['in_app'],
    triggerCondition: 'Daily active games > previous_all_time_high',
  },
  paymaster_balance_low: {
    id: 'paymaster_balance_low',
    name: 'Paymaster Balance Low',
    description: 'Admin alert triggered when the ChessxuPaymaster contract gas balance drops below 1 CELO.',
    queryId: 107,
    defaultSeverity: 'critical',
    defaultChannels: ['in_app', 'webhook'],
    triggerCondition: 'Paymaster balance < 1.0 CELO',
  },
  contract_paused: {
    id: 'contract_paused',
    name: 'Contract Paused',
    description: 'Admin alert triggered when either the Celo or Stacks game contract is paused.',
    queryId: 108,
    defaultSeverity: 'critical',
    defaultChannels: ['in_app', 'webhook'],
    triggerCondition: 'Contract pause state is true',
  },
  unusual_activity: {
    id: 'unusual_activity',
    name: 'Unusual Activity Spike',
    description: 'Admin alert triggered when game creation in the last hour exceeds 3x the 7-day hourly average.',
    queryId: 109,
    defaultSeverity: 'high',
    defaultChannels: ['in_app', 'webhook'],
    triggerCondition: 'Hourly games > 3 * 7-day hourly average',
  },
  weekly_digest: {
    id: 'weekly_digest',
    name: 'Weekly Personal Digest',
    description: 'Weekly summary notification for the player including games played, win rate, and volume.',
    queryId: 110,
    defaultSeverity: 'low',
    defaultChannels: ['in_app'],
    triggerCondition: 'Current time is Sunday 23:59 UTC',
  },
};
