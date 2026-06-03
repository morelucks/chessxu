import { useEffect, useRef, useCallback } from 'react';
import arbiter from '../arbiter/arbiter';
import { Status } from '../constants';
import { SoundEvent } from '../audio';

/**
 * useChessSound — Watches `appState` transitions and triggers the appropriate
 * sound effect via the supplied `playSound` callback.
 *
 * @param {object}   appState   Current game state from the reducer.
 * @param {function} playSound  `(event: string) => void` from `useSoundSettings`.
 */
export default function useChessSound(appState, playSound) {
  const prevState = useRef(null);
  const mountedRef = useRef(false);

  const detectEvent = useCallback(
    (prev, next) => {
      if (!prev) return null;

      // Game ended
      const terminalStatuses = [Status.white, Status.black, Status.stalemate, Status.insufficient];
      if (terminalStatuses.includes(next.status) && !terminalStatuses.includes(prev.status)) {
        return SoundEvent.GAME_END;
      }

      // New game started
      if (prev.status !== 'Ongoing' && next.status === 'Ongoing') {
        return SoundEvent.GAME_START;
      }

      // Turn didn't change → no move happened
      if (prev.turn === next.turn) return null;

      // Check
      const position = next.position?.[next.position.length - 1];
      if (position) {
        const enemy = next.turn; // after the move, it's the opponent's turn
        try {
          if (arbiter.isPlayerInCheck({ positionAfterMove: position, player: enemy })) {
            return SoundEvent.CHECK;
          }
        } catch {
          // arbiter may not expose isPlayerInCheck in all builds
        }
      }

      // Capture — movesList grew and the last move notation contains 'x'
      const prevMoves = prev.movesList?.length ?? 0;
      const nextMoves = next.movesList?.length ?? 0;
      if (nextMoves > prevMoves) {
        const lastMove = next.movesList[next.movesList.length - 1];
        if (lastMove && typeof lastMove === 'string' && lastMove.includes('x')) {
          return SoundEvent.CAPTURE;
        }
        // Castling
        if (lastMove && typeof lastMove === 'string' && (lastMove === 'O-O' || lastMove === 'O-O-O')) {
          return SoundEvent.CASTLE;
        }
      }

      // Default: regular move
      return SoundEvent.MOVE;
    },
    [],
  );

  useEffect(() => {
    // Skip the very first render so we don't fire a sound on mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevState.current = appState;
      return;
    }

    const event = detectEvent(prevState.current, appState);
    if (event && playSound) {
      playSound(event);
    }
    prevState.current = appState;
  }, [appState, playSound, detectEvent]);
}
