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

export interface FreemiumState {
    /** Whether the user can play offline (always true — no wallet needed) */
    canPlayOffline: boolean;
    /** Whether the user can play on-chain (requires wallet) */
    canPlayOnChain: boolean;
    /** Whether the upgrade prompt should currently be visible */
    shouldShowUpgradePrompt: boolean;
    /** Number of offline games played this session */
    offlineGamesPlayed: number;
    /** True when the user has no wallet connected */
    isOfflineMode: boolean;
    /** Call when an offline game completes to track progress */
    onGameComplete: () => void;
    /** Dismiss the upgrade prompt */
    dismissUpgradePrompt: () => void;
}

/**
 * Hook that provides the freemium model state and helpers.
 * Components use this to decide what to render without reaching into the store directly.
 */
export function useFreemium(): FreemiumState {
    const address               = useAppStore((s) => s.address);
    const isOfflineMode          = useAppStore((s) => s.isOfflineMode);
