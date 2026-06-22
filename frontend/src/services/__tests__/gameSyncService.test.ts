// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gameSyncService } from '../gameSyncService';
import { gameHistoryDB } from '../gameHistoryDB';
import celoService from '../../chess/services/celoService';
import stacksService from '../../chess/services/stacksService';

// Mock gameHistoryDB
vi.mock('../gameHistoryDB', () => {
  return {
    gameHistoryDB: {
      init: vi.fn().mockResolvedValue(undefined),
      getPlayerGames: vi.fn().mockResolvedValue([]),
      saveGame: vi.fn().mockResolvedValue(undefined),
    }
  };
});

// Mock Celo service
vi.mock('../../chess/services/celoService', () => {
  return {
    default: {
      getGameCount: vi.fn().mockResolvedValue(0),
      getGame: vi.fn().mockResolvedValue(null as any),
    }
  };
});

// Mock Stacks service
vi.mock('../../chess/services/stacksService', () => {
  return {
    default: {
      getGameCount: vi.fn().mockResolvedValue(0),
      getGameState: vi.fn().mockResolvedValue(null),
    }
  };
});

describe('GameSyncService', () => {
  const player = '0xPlayerAddress';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset private fields on the singleton
    (gameSyncService as any).isSyncing = false;
    (gameSyncService as any).lastSyncTime = null;
    (gameSyncService as any).syncListeners = [];
  });

  describe('Getters & Subscription', () => {
    it('should report syncing state and last sync time correctly', () => {
      expect(gameSyncService.syncing).toBe(false);
      expect(gameSyncService.lastSync).toBeNull();
    });

    it('should support subscribing to sync progress updates', async () => {
      const progressList: any[] = [];
      const unsubscribe = gameSyncService.onSyncProgress((p) => {
        progressList.push(p);
      });

      // Mock Celo service responses to trigger processing loop
      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(2);
      vi.mocked(celoService.getGame).mockResolvedValue({
        playerW: player,
        playerB: '0xOther',
        wager: 10n,
        isNative: true,
        boardState: '...',
        turn: 'w',
        status: 1, // Ongoing
      } as any);

      await gameSyncService.syncPlayerGames(player, 'celo');

      expect(progressList.length).toBeGreaterThan(0);
      expect(progressList[progressList.length - 1]).toEqual({
        total: 2,
        synced: 2,
        failed: 0,
        isComplete: true,
      });

      // Verify unsubscribe works
      unsubscribe();
      progressList.length = 0;
      await gameSyncService.syncPlayerGames(player, 'celo');
      expect(progressList).toHaveLength(0);
    });
  });

  describe('syncPlayerGames on Celo', () => {
