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

    it('returns win for black player when black wins (status 3)', () => {
      expect(determinePlayerResult(3, true)).toBe('loss');
      expect(determinePlayerResult(3, false)).toBe('win');
    });

    it('returns draw for any player when status is 4', () => {
      expect(determinePlayerResult(4, true)).toBe('draw');
      expect(determinePlayerResult(4, false)).toBe('draw');
    });

    it('returns undefined for other statuses', () => {
      expect(determinePlayerResult(1, true)).toBeUndefined();
      expect(determinePlayerResult(0, false)).toBeUndefined();
    });
  });

  describe('getStatusText', () => {
    it('returns correct text for all known statuses', () => {
      expect(getStatusText(0)).toBe('Waiting for opponent');
      expect(getStatusText(1)).toBe('Game in progress');
      expect(getStatusText(2)).toBe('White wins');
      expect(getStatusText(3)).toBe('Black wins');
      expect(getStatusText(4)).toBe('Draw');
      expect(getStatusText(5)).toBe('Cancelled');
    });

    it('returns Unknown for invalid status', () => {
      expect(getStatusText(99 as any)).toBe('Unknown');
    });
  });

  describe('getStatusColor', () => {
    it('returns a hex color string for valid statuses', () => {
      expect(getStatusColor(0)).toBe('#fbbf24');
      expect(getStatusColor(2)).toBe('#22c55e');
      expect(getStatusColor(99 as any)).toBe('#94a3b8');
    });
  });

  describe('getResultColor', () => {
    it('returns green for win, red for loss, gray for draw', () => {
      expect(getResultColor('win')).toBe('#22c55e');
      expect(getResultColor('loss')).toBe('#ef4444');
      expect(getResultColor('draw')).toBe('#94a3b8');
      expect(getResultColor(undefined as any)).toBe('#f59e0b');
    });
  });

  describe('player roles and addresses', () => {
    it('correctly identifies player color roles', () => {
      expect(isPlayerWhite(mockGame, '0xWhiteAddress')).toBe(true);
      expect(isPlayerWhite(mockGame, '0xwhiteaddress')).toBe(true); // case insensitivity
      expect(isPlayerWhite(mockGame, '0xBlackAddress')).toBe(false);

      expect(isPlayerBlack(mockGame, '0xBlackAddress')).toBe(true);
      expect(isPlayerBlack(mockGame, '0xblackaddress')).toBe(true);
      expect(isPlayerBlack(mockGame, '0xWhiteAddress')).toBe(false);
    });

