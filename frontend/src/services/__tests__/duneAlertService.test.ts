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

describe('DuneAlertService - Alert Evaluation Logic', () => {
  const storeState = useNotificationStore.getState() as any;
  const currentUser = '0x1111111111111111111111111111111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    storeState.notifications = [];
    storeState.addNotification.mockResolvedValue(undefined);

    // Mock global fetch to prevent actual network calls hanging during tests
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));

    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should trigger game_joined alert when current user is the creator and another player joins', async () => {
    const events: DuneEventRow[] = [
      {
        event_id: 'evt_joined_1',
        timestamp: new Date().toISOString(),
        type: 'game_joined',
        creator: currentUser,
        joiner: '0x2222222222222222222222222222222222222222',
        gameId: 101,
      },
    ];

    await duneAlertService.evaluateAlerts(events, currentUser, false);

    expect(storeState.addNotification).toHaveBeenCalledTimes(1);
    expect(storeState.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt_joined_1',
        type: 'game_joined',
        severity: 'high',
        body: 'Player 0x2222 joined game #101',
      })
    );
  });

  it('should not trigger game_joined alert if the current user is not the creator', async () => {
    const events: DuneEventRow[] = [
      {
        event_id: 'evt_joined_2',
        timestamp: new Date().toISOString(),
        type: 'game_joined',
        creator: '0x3333333333333333333333333333333333333333',
        joiner: currentUser,
        gameId: 102,
      },
    ];

    await duneAlertService.evaluateAlerts(events, currentUser, false);

