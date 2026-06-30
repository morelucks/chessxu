// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gameSyncService } from '../gameSyncService';
import { gameHistoryDB } from '../gameHistoryDB';
import celoService from '../../chess/services/celoService';
import stacksService from '../../chess/services/stacksService';
import { getGameBlockTimestamp } from '../blockTimestampService';

// Mock dependencies
vi.mock('../gameHistoryDB', () => {
  return {
    gameHistoryDB: {
      init: vi.fn().mockResolvedValue(undefined),
      getPlayerGames: vi.fn().mockResolvedValue([]),
      saveGame: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('../../chess/services/celoService', () => {
  return {
    default: {
      getGameCount: vi.fn().mockResolvedValue(0),
      getGame: vi.fn().mockResolvedValue(null),
    },
  };
});

vi.mock('../../chess/services/stacksService', () => {
  return {
    default: {
      getGameCount: vi.fn().mockResolvedValue(0),
      getGameState: vi.fn().mockResolvedValue(null),
    },
  };
});

vi.mock('../blockTimestampService', () => {
  return {
    getGameBlockTimestamp: vi.fn().mockResolvedValue(1700000000000),
    default: {
      getGameBlockTimestamp: vi.fn().mockResolvedValue(1700000000000),
    },
  };
});

describe('GameSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state of the singleton
    (gameSyncService as any).isSyncing = false;
    (gameSyncService as any).lastSyncTime = null;
    (gameSyncService as any).syncListeners = [];
  });

  describe('syncPlayerGames - Celo', () => {
    it('should successfully sync new Celo games where player is involved', async () => {
      const playerAddress = '0xPlayer';
      
      // Mock db returns no existing games
      vi.mocked(gameHistoryDB.getPlayerGames).mockResolvedValueOnce([]);

      // Mock contract count and game details
      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(2);
      
      // Game 2: Player is White
      vi.mocked(celoService.getGame).mockImplementation(async (id) => {
        if (id === 2) {
          return {
            playerW: playerAddress,
            playerB: '0xOpponent',
            wager: 100n,
            isNative: true,
            boardState: 'start',
            turn: 'w',
            status: 1, // Ongoing
          };
        }
        // Game 1: Player not involved
        if (id === 1) {
          return {
            playerW: '0xOther1',
            playerB: '0xOther2',
            wager: 50n,
            isNative: true,
            boardState: 'start',
            turn: 'w',
            status: 1,
          };
        }
        return null;
      });

      // Mock block timestamp
      vi.mocked(getGameBlockTimestamp).mockResolvedValueOnce(1680000000000);

      const progressUpdates: any[] = [];
      const unsubscribe = gameSyncService.onSyncProgress((progress) => {
        progressUpdates.push({ ...progress });
      });

      const result = await gameSyncService.syncPlayerGames(playerAddress, 'celo');

      expect(gameHistoryDB.init).toHaveBeenCalled();
      expect(celoService.getGameCount).toHaveBeenCalled();
      expect(celoService.getGame).toHaveBeenCalledWith(2);
      expect(celoService.getGame).toHaveBeenCalledWith(1);
      expect(getGameBlockTimestamp).toHaveBeenCalledWith('celo', 2);
      expect(gameHistoryDB.saveGame).toHaveBeenCalledTimes(1);
      
      expect(result.success).toBe(true);
      expect(result.gamesAdded).toBe(1);
      expect(result.gamesUpdated).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].isComplete).toBe(true);

      unsubscribe();
    });

    it('should skip syncing completed games if they are already in database', async () => {
      const playerAddress = '0xPlayer';

      // Mock db returns game 1 as already cached and completed (status 2)
      vi.mocked(gameHistoryDB.getPlayerGames).mockResolvedValueOnce([
        {
          gameId: 1,
          chain: 'celo',
          playerW: playerAddress,
          playerB: '0xOpponent',
          wager: '100',
          isNative: true,
          boardState: 'end',
          turn: 'w',
          status: 2, // Winner White (completed)
          timestamp: 1680000000000,
          lastUpdated: Date.now(),
          syncedAt: Date.now(),
          moveHistory: [],
        },
      ]);

      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(1);
      vi.mocked(celoService.getGame).mockResolvedValueOnce({
        playerW: playerAddress,
        playerB: '0xOpponent',
        wager: 100n,
        isNative: true,
        boardState: 'end',
        turn: 'w',
        status: 2, // Winner White
      });

      const result = await gameSyncService.syncPlayerGames(playerAddress, 'celo', { forceRefresh: false });

      // Should not save game since it is completed and already cached
      expect(gameHistoryDB.saveGame).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.gamesAdded).toBe(0);
      expect(result.gamesUpdated).toBe(0);
    });

    it('should force sync completed games if forceRefresh is true', async () => {
      const playerAddress = '0xPlayer';

      vi.mocked(gameHistoryDB.getPlayerGames).mockResolvedValueOnce([
        {
          gameId: 1,
          chain: 'celo',
          playerW: playerAddress,
          playerB: '0xOpponent',
          wager: '100',
          isNative: true,
          boardState: 'end',
          turn: 'w',
          status: 2,
          timestamp: 1680000000000,
          lastUpdated: Date.now(),
          syncedAt: Date.now(),
          moveHistory: [],
        },
      ]);

      vi.mocked(celoService.getGameCount).mockResolvedValueOnce(1);
      vi.mocked(celoService.getGame).mockResolvedValueOnce({
        playerW: playerAddress,
        playerB: '0xOpponent',
        wager: 100n,
        isNative: true,
        boardState: 'end',
        turn: 'w',
        status: 2,
      });

      const result = await gameSyncService.syncPlayerGames(playerAddress, 'celo', { forceRefresh: true });

      expect(gameHistoryDB.saveGame).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.gamesUpdated).toBe(1);
    });
  });

  describe('syncPlayerGames - Stacks', () => {
    it('should successfully sync new Stacks games where player is involved', async () => {
      const playerAddress = 'SPPlayer';

      vi.mocked(gameHistoryDB.getPlayerGames).mockResolvedValueOnce([]);
      vi.mocked(stacksService.getGameCount).mockResolvedValueOnce(1);
      vi.mocked(stacksService.getGameState).mockResolvedValueOnce({
        'player-w': playerAddress,
        'player-b': 'SPOpponent',
        wager: 50n,
        'is-stx': true,
        'board-state': 'start',
        turn: 'w',
        status: 1,
      });

      const result = await gameSyncService.syncPlayerGames(playerAddress, 'stacks');

      expect(stacksService.getGameCount).toHaveBeenCalled();
      expect(stacksService.getGameState).toHaveBeenCalledWith(1);
      expect(getGameBlockTimestamp).toHaveBeenCalledWith('stacks', 1, expect.any(String));
      expect(gameHistoryDB.saveGame).toHaveBeenCalledTimes(1);

      expect(result.success).toBe(true);
      expect(result.gamesAdded).toBe(1);
    });
  });

  describe('syncGame', () => {
    it('should sync a single Celo game by ID', async () => {
      vi.mocked(celoService.getGame).mockResolvedValueOnce({
        playerW: '0xW',
        playerB: '0xB',
        wager: 100n,
        isNative: true,
        boardState: 'start',
        turn: 'w',
        status: 1,
      });

      const success = await gameSyncService.syncGame(10, 'celo');

      expect(celoService.getGame).toHaveBeenCalledWith(10);
      expect(getGameBlockTimestamp).toHaveBeenCalledWith('celo', 10, undefined);
      expect(gameHistoryDB.saveGame).toHaveBeenCalledWith(expect.objectContaining({
        gameId: 10,
        chain: 'celo',
        playerW: '0xW',
        playerB: '0xB',
        timestamp: 1700000000000,
      }));
      expect(success).toBe(true);
    });

    it('should sync a single Stacks game by ID', async () => {
      vi.mocked(stacksService.getGameState).mockResolvedValueOnce({
        'player-w': 'SPW',
        'player-b': 'SPB',
        wager: 50n,
        'is-stx': true,
        'board-state': 'start',
        turn: 'w',
        status: 1,
      });

      const success = await gameSyncService.syncGame(20, 'stacks');

      expect(stacksService.getGameState).toHaveBeenCalledWith(20);
      expect(getGameBlockTimestamp).toHaveBeenCalledWith('stacks', 20, expect.any(String));
      expect(success).toBe(true);
    });

    it('should return false if game is not found on-chain', async () => {
      vi.mocked(celoService.getGame).mockResolvedValueOnce(null);

      const success = await gameSyncService.syncGame(99, 'celo');

      expect(success).toBe(false);
      expect(gameHistoryDB.saveGame).not.toHaveBeenCalled();
    });
  });

  describe('autoSync', () => {
    it('should trigger sync if no sync has occurred yet', async () => {
      const syncSpy = vi.spyOn(gameSyncService, 'syncPlayerGames').mockResolvedValueOnce({
        success: true,
        gamesAdded: 1,
        gamesUpdated: 0,
        errors: [],
        duration: 5,
      });

      await gameSyncService.autoSync('0xPlayer', 'celo');

      expect(syncSpy).toHaveBeenCalledWith('0xPlayer', 'celo', { maxGames: 30, forceRefresh: false });
    });

    it('should skip sync if last sync was less than an hour ago', async () => {
      const syncSpy = vi.spyOn(gameSyncService, 'syncPlayerGames');
      
      // Set last sync to 10 minutes ago
      (gameSyncService as any).lastSyncTime = Date.now() - 10 * 60 * 1000;

      await gameSyncService.autoSync('0xPlayer', 'celo');

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('should trigger sync if last sync was more than an hour ago', async () => {
      const syncSpy = vi.spyOn(gameSyncService, 'syncPlayerGames').mockResolvedValueOnce({
        success: true,
        gamesAdded: 0,
        gamesUpdated: 0,
        errors: [],
        duration: 5,
      });

      // Set last sync to 70 minutes ago
      (gameSyncService as any).lastSyncTime = Date.now() - 70 * 60 * 1000;

      await gameSyncService.autoSync('0xPlayer', 'celo');

      expect(syncSpy).toHaveBeenCalled();
    });
  });
});
