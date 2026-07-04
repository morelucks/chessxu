/**
 * useFreemium — freemium model hook for #186
 *
 * Exposes helpers for the offline-first freemium model:
 * - canPlayOffline: always true (no wallet required for PvC / pass-and-play)
 * - canPlayOnChain: true only when wallet is connected
 * - shouldShowUpgradePrompt: true after UPGRADE_THRESHOLD offline games
 * - onGameComplete: call when an offline game ends
 */

import { useCallback } from 'react';
import useAppStore from '../zustand/store';

/** Number of free offline games before showing the upgrade prompt */
export const UPGRADE_THRESHOLD = 3;
