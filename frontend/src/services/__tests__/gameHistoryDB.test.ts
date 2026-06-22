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
