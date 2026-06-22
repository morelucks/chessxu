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
