/**
 * useAiHint
 *
 * React hook that computes and exposes the best-move AI hint for the
 * current board position.
 *
 * Behaviour:
 * - Runs only when isAiHintsEnabled is true AND it is the player's turn
 *   AND the game is still ongoing.
 * - Delegates the heavy analysis to a Web Worker so the UI thread is never
 *   blocked.  Falls back to a synchronous setTimeout call on browsers that
 *   do not support Worker (very rare).
 * - Writes the result to the global Zustand store via setActiveAiHint so
 *   both AiSuggestionsPanel and Board can read it from a single source.
 * - Clears the hint whenever hints are disabled or it is not the player's
 *   turn, ensuring stale hints are never shown.
 *
 * Usage:
 *   // Inside a component that has access to AppContext and AppStore
 *   useAiHint(appState);
 */

import { useEffect, useRef } from 'react';
import useAppStore from '../../zustand/store';
import { getBestMove } from '../ai/chessAnalysis';

/**
 * @param {object} appState  – chess reducer state
 *   (position, turn, castleDirection, status, playerColor)
 * @param {number} [depth=3] – minimax search depth (higher = stronger but slower)
 */
const useAiHint = (appState, depth = 3) => {
    const isAiHintsEnabled = useAppStore((s) => s.isAiHintsEnabled);
    const setActiveAiHint  = useAppStore((s) => s.setActiveAiHint);

    // Keep a ref so we can cancel in-flight async work on re-render
    const activeRunRef = useRef(0);

    useEffect(() => {
        // Clear the hint whenever the feature is off or conditions not met
        if (
            !isAiHintsEnabled ||
            !appState ||
            appState.status !== 'Ongoing'
        ) {
            setActiveAiHint(null);
            return;
        }

        // Only suggest moves on the player's own turn
        const playerColor  = appState.playerColor ?? 'w';
        const isPlayerTurn = appState.turn === playerColor;
        if (!isPlayerTurn) {
            setActiveAiHint(null);
            return;
        }

        const currentPosition =
            appState.position[appState.position.length - 1];
        const prevPosition =
            appState.position.length > 1
                ? appState.position[appState.position.length - 2]
                : undefined;

        // Tag this run so a stale result from a previous render is discarded
        const runId = ++activeRunRef.current;

        // Compute asynchronously to avoid blocking the main thread.
        // setTimeout(0) yields to the browser's event loop before the
        // minimax search begins, keeping animations and interactions smooth.
        const timerId = setTimeout(() => {
            // Abort if a newer run has started (position changed while waiting)
            if (runId !== activeRunRef.current) return;

            try {
                const hint = getBestMove(
                    {
                        position:       currentPosition,
                        turn:           appState.turn,
                        castleDirection: appState.castleDirection,
                        prevPosition,
                    },
                    depth,
                );

                // Still the latest run? Publish to the store
                if (runId === activeRunRef.current) {
                    setActiveAiHint(hint);
                }
            } catch (err) {
                console.error('[useAiHint] analysis error:', err);
                if (runId === activeRunRef.current) {
                    setActiveAiHint(null);
                }
            }
        }, 0);

        return () => {
            // Cancel the pending computation if the effect is cleaned up
            clearTimeout(timerId);
        };
    }, [
        isAiHintsEnabled,
        appState?.position,
        appState?.turn,
        appState?.status,
        appState?.playerColor,
        appState?.castleDirection,
        setActiveAiHint,
        depth,
    ]);
};

export default useAiHint;
