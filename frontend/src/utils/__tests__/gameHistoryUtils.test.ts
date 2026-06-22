import { describe, it, expect } from 'vitest';
import {
  determinePlayerResult,
  getStatusText,
  getStatusColor,
  getResultColor,
  isPlayerWhite,
  isPlayerBlack,
  getOpponentAddress,
  getPlayerColor,
  calculatePlayerStats,
  formatAddress,
  formatWager,
  isGameActive,
  isGameCompleted,
  parseFEN,
} from '../gameHistoryUtils';
import { CachedGame } from '../../services/gameHistoryDB';

describe('gameHistoryUtils', () => {
  const mockGame: CachedGame = {
    gameId: 1,
    chain: 'celo',
    playerW: '0xWhiteAddress',
    playerB: '0xBlackAddress',
    wager: '100000000000000000', // 0.1 CELO in Wei or standard units
    isNative: true,
    boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
    turn: 'w',
    status: 1, // in progress
    timestamp: Date.now() - 3600000, // 1 hour ago
    lastUpdated: Date.now(),
    syncedAt: Date.now(),
  };

  describe('determinePlayerResult', () => {
    it('returns win for white player when white wins (status 2)', () => {
      expect(determinePlayerResult(2, true)).toBe('win');
      expect(determinePlayerResult(2, false)).toBe('loss');
    });
