/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { duneAlertService, DuneEventRow } from '../duneAlertService';
import { useNotificationStore } from '../../zustand/notificationStore';

// Mock Zustand store
vi.mock('../../zustand/notificationStore', () => {
  const mockStore = {
    notifications: [] as any[],
    enabledAlerts: {
      game_joined: true,
      game_resolved: true,
      opponent_resigned: true,
      leaderboard_rank: true,
      wager_milestone: true,
      daily_games_record: true,
      paymaster_balance_low: true,
      contract_paused: true,
      unusual_activity: true,
      weekly_digest: true,
    },
    enabledChannels: {
      in_app: true,
      farcaster_push: true,
      webhook: true,
    },
    farcasterPushEnabled: true,
    farcasterPushToken: 'mock-token',
    farcasterPushUrl: 'https://mock.farcaster/push',
    webhookUrl: 'https://mock.webhook/discord',
    addNotification: vi.fn(),
  };

  return {
    useNotificationStore: {
      getState: () => mockStore,
    },
  };
});

