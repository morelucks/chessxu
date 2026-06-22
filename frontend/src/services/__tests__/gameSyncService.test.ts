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
