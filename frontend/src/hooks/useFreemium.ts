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
    const offlineGamesPlayed     = useAppStore((s) => s.offlineGamesPlayed);
    const upgradePromptDismissed = useAppStore((s) => s.upgradePromptDismissed);
    const incrementOfflineGames  = useAppStore((s) => s.incrementOfflineGames);
    const storeDismiss           = useAppStore((s) => s.dismissUpgradePrompt);

    const canPlayOffline  = true; // No wallet required — always available
    const canPlayOnChain  = !!address;

    // Show the upgrade prompt once threshold is hit, unless dismissed
    const shouldShowUpgradePrompt =
        isOfflineMode &&
        !upgradePromptDismissed &&
        offlineGamesPlayed >= UPGRADE_THRESHOLD;

    const onGameComplete = useCallback(() => {
        if (isOfflineMode) incrementOfflineGames();
    }, [isOfflineMode, incrementOfflineGames]);

    const dismissUpgradePrompt = useCallback(() => {
        storeDismiss();
    }, [storeDismiss]);

    return {
        canPlayOffline,
        canPlayOnChain,
        shouldShowUpgradePrompt,
        offlineGamesPlayed,
        isOfflineMode,
        onGameComplete,
        dismissUpgradePrompt,
    };
}

export default useFreemium;
// UPGRADE_THRESHOLD=3 is low enough to show value quickly without blocking play
// canPlayOffline is always true — this is the core freemium guarantee
// canPlayOnChain derives from address — falsy when no wallet connected
// onGameComplete is memoised to prevent unnecessary re-renders
// upgradePromptDismissed persists via zustand-persist across page reloads
// dismissUpgradePrompt lets users opt out without connecting a wallet
// useFreemium is the single source of truth for freemium model decisions
// Freemium model: free offline play -> optional upgrade to on-chain play
// shouldShowUpgradePrompt is computed, not stored, to stay reactive
// isOfflineMode mirrors !address — no need for separate sync logic
// Hook can be called in any component without prop-drilling wallet state
// All FreemiumState fields are read-only from consumer perspective
// This satisfies issue #186: lower barrier to entry for new players
// UPGRADE_THRESHOLD exported so banner and other components stay in sync
// useFreemium replaces direct store access to keep freemium logic centralised
// Pass-and-play mode (two humans on one device) also works fully offline
