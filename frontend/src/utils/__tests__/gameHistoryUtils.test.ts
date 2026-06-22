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
