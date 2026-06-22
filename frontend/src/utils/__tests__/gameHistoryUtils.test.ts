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
