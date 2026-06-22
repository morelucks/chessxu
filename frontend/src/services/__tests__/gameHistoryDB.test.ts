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

