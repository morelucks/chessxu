/**
 * useAiHint — React hook that computes and stores the AI best-move hint.
 * Part of feat #187: AI recommendations during gameplay.
 */

import { useEffect, useRef } from 'react';
import useAppStore from '../../zustand/store';
import { getBestMove } from '../ai/chessAnalysis';

/**
 * @param {object} appState  - chess reducer state
 * @param {number} [depth=3]  - minimax search depth
 */
const useAiHint = (appState, depth = 3) => {
    const isAiHintsEnabled = useAppStore((s) => s.isAiHintsEnabled);
    const setActiveAiHint  = useAppStore((s) => s.setActiveAiHint);

    // Ref to cancel stale async computations on re-render
    const activeRunRef = useRef(0);

    useEffect(() => {
        // Clear hint when feature is off or game not ongoing
        if (!isAiHintsEnabled || !appState || appState.status !== 'Ongoing') {
            setActiveAiHint(null);
            return;
        }

        // Only suggest on the player's own turn
        const playerColor  = appState.playerColor ?? 'w';
        const isPlayerTurn = appState.turn === playerColor;
        if (!isPlayerTurn) { setActiveAiHint(null); return; }

        const currentPosition = appState.position[appState.position.length - 1];
        const prevPosition = appState.position.length > 1
            ? appState.position[appState.position.length - 2]
            : undefined;

        // Tag this run; discard results from a superseded render
        const runId = ++activeRunRef.current;
