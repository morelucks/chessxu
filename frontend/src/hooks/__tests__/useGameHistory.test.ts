/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameHistory } from '../useGameHistory';
import { gameHistoryDB } from '../../services/gameHistoryDB';
import { gameSyncService } from '../../services/gameSyncService';

// Mock Zustand store
vi.mock('../../zustand/store', () => {
  const store = {
    address: '0x1111111111111111111111111111111111111111',
    activeChain: 'Celo',
  };
  const mockUseAppStore = (selector: any) => selector(store);
  return {
    default: mockUseAppStore,
    useAppStore: mockUseAppStore,
  };
});

// Mock gameHistoryDB
vi.mock('../../services/gameHistoryDB', () => {
  return {
    gameHistoryDB: {
      init: vi.fn().mockResolvedValue(undefined),
      getPlayerGames: vi.fn().mockResolvedValue([
        {
          gameId: 1,
          playerW: '0x1111111111111111111111111111111111111111',
          playerB: '0x2222222222222222222222222222222222222222',
          status: 2, // White wins
          wager: '10',
          chain: 'Celo',
        },
        {
          gameId: 2,
          playerW: '0x2222222222222222222222222222222222222222',
          playerB: '0x1111111111111111111111111111111111111111',
          status: 0, // Ongoing
          wager: '5',
          chain: 'Celo',
        }
      ]),
    }
  };
});

// Mock gameSyncService
vi.mock('../../services/gameSyncService', () => {
  return {
    gameSyncService: {
      lastSync: 123456789,
      syncing: false,
      syncPlayerGames: vi.fn().mockResolvedValue({
        added: 1,
        updated: 0,
        failed: 0,
      }),
      onSyncProgress: vi.fn().mockReturnValue(() => {}),
      autoSync: vi.fn().mockResolvedValue(undefined),
    }
  };
});

describe('useGameHistory hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load games initially', async () => {
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useGameHistory());
      result = rendered.result;
    });

    expect(gameHistoryDB.init).toHaveBeenCalled();
    expect(gameHistoryDB.getPlayerGames).toHaveBeenCalledWith(
      '0x1111111111111111111111111111111111111111',
      'Celo'
    );
    expect(result.current.games).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastSync).toBe(123456789);
  });

  it('should calculate correct stats', async () => {
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useGameHistory());
      result = rendered.result;
    });

    expect(result.current.stats).toEqual({
      totalGames: 2,
      wins: 1, // status: 2 (White wins), user is playerW (White) -> win
      losses: 0,
      draws: 0,
      ongoing: 1, // status: 0
    });
  });

  it('should retrieve a specific game by ID', async () => {
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useGameHistory());
      result = rendered.result;
    });

    const game = result.current.getGame(1);
    expect(game).toBeDefined();
    expect(game?.gameId).toBe(1);

    const nonExistent = result.current.getGame(99);
    expect(nonExistent).toBeUndefined();
