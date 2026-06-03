import { useEffect, useRef, useCallback } from 'react';
import arbiter from '../arbiter/arbiter';
import { Status } from '../constants';

/**
 * Hook that watches the chess game state and fires the appropriate sound
 * effect whenever a move, capture, check, checkmate, stalemate, or other
 * terminal event occurs.
 *
 * This keeps all sound‑trigger logic in one place so the rest of the
 * codebase stays decoupled from the audio subsystem.
 *
 * @param {object}   appState       — The current chess appState from the reducer.
 * @param {function} playSoundFn    — `play` function from useSoundSettings.
 */
const useChessSound = (appState, playSoundFn) => {
  const prevMoveCount = useRef(appState.movesList?.length ?? 0);
  const prevStatus = useRef(appState.status);
  const prevPositionLength = useRef(appState.position?.length ?? 1);

  /**
   * Determine the sound type for the latest move by comparing the old and
   * new positions.
   */
  const detectMoveType = useCallback((oldPosition, newPosition, moveNotation) => {
    if (!oldPosition || !newPosition) return 'move';

    // Castling — move notation is O-O or O-O-O
    if (moveNotation && (moveNotation === 'O-O' || moveNotation === 'O-O-O')) {
      return 'castle';
    }

    // Promotion — notation contains '='
    if (moveNotation && moveNotation.includes('=')) {
      return 'promote';
    }

    // Capture — notation contains 'x'
    if (moveNotation && moveNotation.includes('x')) {
      return 'capture';
    }

    // Capture fallback: count occupied squares; if the new position has fewer,
    // something was taken.
    const countPieces = (pos) => {
      let n = 0;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          if (pos[r][f]) n++;
        }
      }
      return n;
    };
    if (countPieces(newPosition) < countPieces(oldPosition)) {
      return 'capture';
    }

    return 'move';
  }, []);

  // ----- React to moves -----
  useEffect(() => {
    const currentMoveCount = appState.movesList?.length ?? 0;
    const currentPositionLength = appState.position?.length ?? 1;

    // Only fire when a new move has actually been appended.
    if (
      currentMoveCount > prevMoveCount.current &&
      currentPositionLength > prevPositionLength.current
    ) {
      const moveNotation = appState.movesList[currentMoveCount - 1];
      const oldPosition = appState.position[currentPositionLength - 2];
      const newPosition = appState.position[currentPositionLength - 1];

      const type = detectMoveType(oldPosition, newPosition, moveNotation);
      playSoundFn(type);

      // After playing the move sound, check if the opponent is now in check
      // (but NOT checkmate — checkmate is handled as a game‑end event).
      if (appState.status === Status.ongoing) {
        const isInCheck = arbiter.isPlayerInCheck({
          positionAfterMove: newPosition,
          player: appState.turn,
        });
        if (isInCheck) {
          // Small delay so check sting plays after the move sound.
          setTimeout(() => playSoundFn('check'), 120);
        }
      }
    }

    prevMoveCount.current = currentMoveCount;
    prevPositionLength.current = currentPositionLength;
  }, [appState.movesList, appState.position, appState.status, appState.turn, playSoundFn, detectMoveType]);

  // ----- React to game status changes -----
  useEffect(() => {
    if (appState.status === prevStatus.current) return;

    switch (appState.status) {
      case Status.white:
      case Status.black:
        // Determine win / loss relative to the player.
        if (appState.gameMode === 'pvc') {
          const playerWon =
            (appState.playerColor === 'w' && appState.status === Status.white) ||
            (appState.playerColor === 'b' && appState.status === Status.black);
          playSoundFn(playerWon ? 'game-win' : 'game-loss');
        } else {
          // PvP — always play the win sound.
          playSoundFn('game-win');
        }
        break;

      case Status.stalemate:
      case Status.insufficient:
        playSoundFn('game-draw');
        break;

      case Status.ongoing:
        // A new game has started when we transition from a non‑ongoing state
        // back to ongoing.
        if (prevStatus.current && prevStatus.current !== Status.promoting) {
          playSoundFn('game-start');
        }
        break;

      default:
        break;
    }

    prevStatus.current = appState.status;
  }, [appState.status, appState.gameMode, appState.playerColor, playSoundFn]);
};

export default useChessSound;
