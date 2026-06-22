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
    it('should sync new games and update syncing state/lastSync time', async () => {
      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(2);
      vi.mocked(celoService.getGame).mockImplementation(async (id) => {
        if (id === 2) {
          return {
            playerW: player,
            playerB: '0xBob',
            wager: 100n,
            isNative: true,
            boardState: 'state2',
            turn: 'w',
            status: 2, // White wins
          } as any;
        }
        if (id === 1) {
          return {
            playerW: '0xBob',
            playerB: player,
            wager: 50n,
            isNative: false,
            boardState: 'state1',
            turn: 'b',
            status: 3, // Black wins (player B wins)
          } as any;
        }
        return null as any;
      });

      const result = await gameSyncService.syncPlayerGames(player, 'celo');

      expect(gameHistoryDB.init).toHaveBeenCalled();
      expect(gameHistoryDB.getPlayerGames).toHaveBeenCalledWith(player, 'celo');
      expect(celoService.getGameCount).toHaveBeenCalled();
      expect(celoService.getGame).toHaveBeenCalledWith(2);
      expect(celoService.getGame).toHaveBeenCalledWith(1);

      expect(gameHistoryDB.saveGame).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.gamesAdded).toBe(2);
      expect(result.gamesUpdated).toBe(0);
      expect(gameSyncService.lastSync).not.toBeNull();
    });

    it('should filter games where the player is not participant', async () => {
      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(1);
      vi.mocked(celoService.getGame).mockResolvedValueOnce({
        playerW: '0xAlice',
        playerB: '0xBob',
        wager: 10n,
        isNative: true,
        boardState: '...',
        turn: 'w',
        status: 1,
      } as any);

      const result = await gameSyncService.syncPlayerGames(player, 'celo');
      expect(gameHistoryDB.saveGame).not.toHaveBeenCalled();
      expect(result.gamesAdded).toBe(0);
    });

    it('should update existing games if forced or not finished', async () => {
      // Mock existing cached games
      vi.mocked(gameHistoryDB.getPlayerGames).mockResolvedValueOnce([
        {
          gameId: 1,
          chain: 'celo',
          playerW: player,
          playerB: '0xBob',
          wager: '10',
          isNative: true,
          boardState: 'oldState',
          turn: 'w',
          status: 1, // Ongoing
          timestamp: 0,
          lastUpdated: 0,
          syncedAt: 0,
        }
      ]);

      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(1);
      vi.mocked(celoService.getGame).mockResolvedValueOnce({
        playerW: player,
        playerB: '0xBob',
        wager: 10n,
        isNative: true,
        boardState: 'newState',
        turn: 'b',
        status: 1, // Still ongoing (status < 2)
      } as any);

      const result = await gameSyncService.syncPlayerGames(player, 'celo');
      expect(gameHistoryDB.saveGame).toHaveBeenCalledTimes(1);
      expect(result.gamesUpdated).toBe(1);
    });

    it('should skip updating already completed cached games if forceRefresh is false', async () => {
      // Mock existing cached completed game
      vi.mocked(gameHistoryDB.getPlayerGames).mockResolvedValueOnce([
        {
          gameId: 1,
          chain: 'celo',
          playerW: player,
          playerB: '0xBob',
          wager: '10',
          isNative: true,
          boardState: 'state',
          turn: 'w',
          status: 2, // Completed
          timestamp: 0,
          lastUpdated: 0,
          syncedAt: 0,
        }
      ]);

