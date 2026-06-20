import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    expect(storeState.addNotification).not.toHaveBeenCalled();
  });

  it('should trigger game_resolved alert when game is completed and user participated', async () => {
    const events: DuneEventRow[] = [
      {
        event_id: 'evt_resolved_1',
        timestamp: new Date().toISOString(),
        type: 'game_resolved',
        playerW: currentUser,
        playerB: '0x2222222222222222222222222222222222222222',
        gameId: 101,
        status: 2,
        winner: currentUser,
      },
    ];

    await duneAlertService.evaluateAlerts(events, currentUser, false);

    expect(storeState.addNotification).toHaveBeenCalledTimes(1);
    expect(storeState.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt_resolved_1',
        type: 'game_resolved',
        body: 'Game #101 resolved. Result: You Won!',
      })
    );
  });

  it('should deduplicate already seen alerts', async () => {
    // Put event in notifications list
    storeState.notifications = [{ id: 'evt_dup_1' }];

    const events: DuneEventRow[] = [
      {
        event_id: 'evt_dup_1',
        timestamp: new Date().toISOString(),
        type: 'game_joined',
        creator: currentUser,
        joiner: '0x2222222222222222222222222222222222222222',
        gameId: 101,
      },
    ];

    await duneAlertService.evaluateAlerts(events, currentUser, false);

    expect(storeState.addNotification).not.toHaveBeenCalled();
  });

  it('should trigger paymaster_balance_low alert only if the user is admin', async () => {
    const events: DuneEventRow[] = [
      {
        event_id: 'evt_paymaster_1',
        timestamp: new Date().toISOString(),
        type: 'paymaster_balance_low',
        balance: 0.35,
      },
    ];

    // Try as non-admin
    await duneAlertService.evaluateAlerts(events, currentUser, false);
    expect(storeState.addNotification).not.toHaveBeenCalled();

    // Try as admin
    await duneAlertService.evaluateAlerts(events, currentUser, true);
    expect(storeState.addNotification).toHaveBeenCalledTimes(1);
    expect(storeState.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt_paymaster_1',
        type: 'paymaster_balance_low',
        severity: 'critical',
      })
    );
  });

  it('should trigger contract_paused alert only if user is admin', async () => {
    const events: DuneEventRow[] = [
      {
        event_id: 'evt_paused_1',
        timestamp: new Date().toISOString(),
        type: 'contract_paused',
        chain: 'Stacks',
        paused: true,
      },
    ];

    // Non-admin
    await duneAlertService.evaluateAlerts(events, currentUser, false);
    expect(storeState.addNotification).not.toHaveBeenCalled();

    // Admin
    await duneAlertService.evaluateAlerts(events, currentUser, true);
    expect(storeState.addNotification).toHaveBeenCalledTimes(1);
    expect(storeState.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt_paused_1',
        type: 'contract_paused',
        severity: 'critical',
      })
    );
  });

  it('should trigger leaderboard_rank alert on large rank moves', async () => {
    const events: DuneEventRow[] = [
      {
        event_id: 'evt_rank_1',
        timestamp: new Date().toISOString(),
        type: 'leaderboard_rank',
        player: currentUser,
        rank: 3,
        previousRank: 6, // Delta of 3
      },
    ];

    await duneAlertService.evaluateAlerts(events, currentUser, false);

    expect(storeState.addNotification).toHaveBeenCalledTimes(1);
    expect(storeState.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt_rank_1',
        type: 'leaderboard_rank',
        body: 'Leaderboard Rank Update: You moved UP to #3!',
      })
    );
  });
});
