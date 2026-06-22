// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gameHistoryDB, CachedGame } from '../gameHistoryDB';

// ---------------------------------------------------------------------------
// Mock Classes for IndexedDB
// ---------------------------------------------------------------------------

class MockIDBRequest {
  onsuccess: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  result: any = null;
  error: any = null;
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  onupgradeneeded: ((ev: any) => void) | null = null;
}

class MockIDBDatabase {
  objectStoreNames = {
    contains: vi.fn().mockReturnValue(false),
  };
  createObjectStore = vi.fn().mockReturnValue({
    createIndex: vi.fn(),
  });
  close = vi.fn();
  transaction = (_storeNames: string[], mode: string) => {
    return new MockIDBTransaction(mode);
  };
}

class MockIDBTransaction {
  constructor(public mode: string) {}
  objectStore(_name: string) {
    return mockObjectStore;
  }
}

// In-memory backing store for mock IndexedDB
const storeMap = new Map<string, any>();

const mockObjectStore = {
  put: vi.fn().mockImplementation((game: any) => {
    const key = JSON.stringify([game.chain, game.gameId]);
    storeMap.set(key, game);
    const req = new MockIDBRequest();
    req.result = [game.chain, game.gameId];
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req } as any);
    }, 0);
    return req;
  }),
  get: vi.fn().mockImplementation((keyArray: [string, number]) => {
    const key = JSON.stringify(keyArray);
    const val = storeMap.get(key);
    const req = new MockIDBRequest();
    req.result = val || null;
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req } as any);
    }, 0);
    return req;
  }),
  getAll: vi.fn().mockImplementation(() => {
    const values = Array.from(storeMap.values());
    const req = new MockIDBRequest();
    req.result = values;
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req } as any);
    }, 0);
    return req;
  }),
  delete: vi.fn().mockImplementation((keyArray: [string, number]) => {
    const key = JSON.stringify(keyArray);
    storeMap.delete(key);
    const req = new MockIDBRequest();
    req.result = undefined;
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req } as any);
    }, 0);
    return req;
  }),
  clear: vi.fn().mockImplementation(() => {
    storeMap.clear();
    const req = new MockIDBRequest();
    req.result = undefined;
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req } as any);
    }, 0);
    return req;
  }),
  index: vi.fn().mockImplementation((indexName: string) => {
    return {
      openCursor: vi.fn().mockImplementation((_query: any, _direction: string) => {
        const values = Array.from(storeMap.values());
        if (indexName === 'timestampIndex') {
          // Sort by timestamp descending
          values.sort((a, b) => b.timestamp - a.timestamp);
        }

        const req = new MockIDBRequest();
        let cursorIndex = 0;

        const cursor = {
          get value() {
            return values[cursorIndex];
          },
          continue: () => {
            cursorIndex++;
            if (cursorIndex < values.length) {
              req.result = cursor;
            } else {
              req.result = null;
            }
            if (req.onsuccess) req.onsuccess({ target: req } as any);
          }
        };

        if (values.length > 0) {
          req.result = cursor;
        } else {
          req.result = null;
        }

        setTimeout(() => {
          if (req.onsuccess) req.onsuccess({ target: req } as any);
        }, 0);

        return req;
      })
    };
  })
};

// Mock IndexedDB open requests
let dbOpenShouldFail = false;
let mockDBInstance = new MockIDBDatabase();

const mockIndexedDB = {
  open: vi.fn().mockImplementation((_name: string, _version: number) => {
    const req = new MockIDBOpenDBRequest();
    if (dbOpenShouldFail) {
      req.error = new Error('Mock open database failure');
      setTimeout(() => {
        if (req.onerror) req.onerror({ target: req } as any);
      }, 0);
    } else {
      req.result = mockDBInstance;
      setTimeout(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({
            target: { result: mockDBInstance }
          } as any);
        }
        if (req.onsuccess) {
          req.onsuccess({ target: req } as any);
        }
      }, 0);
    }
    return req;
  })
};

// Stub global indexedDB
vi.stubGlobal('indexedDB', mockIndexedDB);

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('GameHistoryDB Service', () => {
  beforeEach(() => {
    storeMap.clear();
    dbOpenShouldFail = false;
    mockDBInstance = new MockIDBDatabase();
    vi.clearAllMocks();
    // Reset private fields on singleton instance to prevent cached promise leakage
    (gameHistoryDB as any).db = null;
    (gameHistoryDB as any).initPromise = null;
  });

  afterEach(() => {
    gameHistoryDB.close();
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      await expect(gameHistoryDB.init()).resolves.toBeUndefined();
    });

    it('should trigger onupgradeneeded and create object stores/indexes', async () => {
      mockDBInstance.objectStoreNames.contains.mockReturnValue(false);
      await gameHistoryDB.init();

      expect(mockDBInstance.createObjectStore).toHaveBeenCalledWith('games', {
        keyPath: ['chain', 'gameId']
      });
    });

    it('should reject initialization if open fails', async () => {
      dbOpenShouldFail = true;
      await expect(gameHistoryDB.init()).rejects.toThrow('Mock open database failure');
    });

    it('should reuse initialization promise if initialized consecutively', async () => {
      const p1 = gameHistoryDB.init();
      const internalPromise = (gameHistoryDB as any).initPromise;
      const p2 = gameHistoryDB.init();
      
      expect((gameHistoryDB as any).initPromise).toBe(internalPromise);
      await p1;
      await p2;
    });
  });

  describe('Single Game Save & Retrieval', () => {
    const sampleGame: CachedGame = {
      gameId: 101,
      chain: 'celo',
      playerW: '0xW',
      playerB: '0xB',
      wager: '10',
      isNative: true,
      boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      status: 1,
      timestamp: 1700000000000,
      lastUpdated: 0,
      syncedAt: 0
    };

    it('should save game and populate lastUpdated/syncedAt timestamps', async () => {
      await gameHistoryDB.saveGame(sampleGame);
      const saved = await gameHistoryDB.getGame('celo', 101);
      expect(saved).not.toBeNull();
      expect(saved!.gameId).toBe(101);
      expect(saved!.lastUpdated).toBeGreaterThan(0);
      expect(saved!.syncedAt).toBeGreaterThan(0);
    });

    it('should retrieve null if game does not exist', async () => {
      const saved = await gameHistoryDB.getGame('celo', 999);
      expect(saved).toBeNull();
    });
  });

  describe('Batch Save Operations', () => {
    const sampleGames: CachedGame[] = [
      {
        gameId: 201,
        chain: 'celo',
        playerW: '0xW',
        playerB: '0xB',
        wager: '10',
        isNative: true,
        boardState: '...',
        turn: 'w',
        status: 1,
        timestamp: 1700000001000,
        lastUpdated: 0,
        syncedAt: 0
      },
      {
        gameId: 202,
        chain: 'stacks',
        playerW: '0xW2',
        playerB: '0xB2',
        wager: '5',
        isNative: true,
        boardState: '...',
        turn: 'b',
        status: 2,
        timestamp: 1700000002000,
        lastUpdated: 0,
        syncedAt: 0
      }
    ];

    it('should save multiple games in batch successfully', async () => {
      await gameHistoryDB.saveGames(sampleGames);
      const all = await gameHistoryDB.getAllGames();
      expect(all).toHaveLength(2);
    });

    it('should resolve immediately if saving an empty array of games', async () => {
      await expect(gameHistoryDB.saveGames([])).resolves.toBeUndefined();
    });
  });

  describe('Queries & Filtering', () => {
    const games: CachedGame[] = [
      {
        gameId: 1,
        chain: 'celo',
        playerW: '0xAlice',
        playerB: '0xBob',
        wager: '10',
        isNative: true,
        boardState: '...',
        turn: 'w',
        status: 1,
        timestamp: 1700000010000,
        lastUpdated: 0,
        syncedAt: 0
      },
      {
        gameId: 2,
        chain: 'celo',
        playerW: '0xBob',
        playerB: '0xCharlie',
        wager: '5',
        isNative: true,
        boardState: '...',
        turn: 'b',
        status: 2,
        timestamp: 1700000020000,
        lastUpdated: 0,
        syncedAt: 0
      },
      {
        gameId: 3,
        chain: 'stacks',
        playerW: '0xAlice',
        playerB: '0xCharlie',
        wager: '2',
        isNative: true,
        boardState: '...',
        turn: 'w',
        status: 4,
        timestamp: 1700000030000,
        lastUpdated: 0,
        syncedAt: 0
      }
    ];

    beforeEach(async () => {
      await gameHistoryDB.saveGames(games);
    });

    it('should filter games for a player address (case-insensitive)', async () => {
      const aliceGames = await gameHistoryDB.getPlayerGames('0xalice');
      expect(aliceGames).toHaveLength(2);
      expect(aliceGames.map(g => g.gameId)).toContain(1);
      expect(aliceGames.map(g => g.gameId)).toContain(3);
    });

    it('should filter games by player address and chain', async () => {
      const aliceCeloGames = await gameHistoryDB.getPlayerGames('0xAlice', 'celo');
      expect(aliceCeloGames).toHaveLength(1);
      expect(aliceCeloGames[0].gameId).toBe(1);
    });

    it('should return player games sorted by timestamp descending', async () => {
      const aliceGames = await gameHistoryDB.getPlayerGames('0xAlice');
      expect(aliceGames[0].gameId).toBe(3); // Newest timestamp (1700000030000)
      expect(aliceGames[1].gameId).toBe(1); // Oldest timestamp (1700000010000)
    });

    it('should get recent games using cursor-based timestamp ordering', async () => {
      const recent = await gameHistoryDB.getRecentGames(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].gameId).toBe(3); // Newest
      expect(recent[1].gameId).toBe(2);
    });
  });

  describe('Deletion & Clear', () => {
    const sampleGame: CachedGame = {
      gameId: 500,
      chain: 'celo',
      playerW: '0xW',
      playerB: '0xB',
      wager: '10',
      isNative: true,
      boardState: '...',
      turn: 'w',
      status: 1,
      timestamp: 1700000000000,
      lastUpdated: 0,
      syncedAt: 0
    };

    beforeEach(async () => {
      await gameHistoryDB.saveGame(sampleGame);
    });

    it('should delete a specific game successfully', async () => {
      await gameHistoryDB.deleteGame('celo', 500);
      const saved = await gameHistoryDB.getGame('celo', 500);
      expect(saved).toBeNull();
    });

    it('should clear all games in the database', async () => {
      await gameHistoryDB.clearAll();
      const all = await gameHistoryDB.getAllGames();
      expect(all).toHaveLength(0);
    });
  });
