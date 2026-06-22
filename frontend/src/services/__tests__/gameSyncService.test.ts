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
