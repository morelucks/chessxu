import { useCallback } from 'react';
import stacksService from '../services/stacksService';
import useAppStore from '../../zustand/store';

/**
 * Provides contract call helpers bound to the connected wallet.
 * All functions open the Stacks wallet popup for signing.
 */
export function useOnChainGame() {
  const { activeGameId, setActiveGameId, setGameStarted, address } = useAppStore();

  const createGame = useCallback((wager, isStx, onFinish, onCancel) => {
    stacksService.createGame(wager, isStx,
      async (payload) => {
        // After broadcast, fetch the latest game ID
        const lastId = await stacksService.getLastGameId();
        setActiveGameId(lastId);
        setGameStarted(true);
        onFinish?.(payload);
      },
      onCancel,
    );
  }, [setActiveGameId, setGameStarted]);

  const joinGame = useCallback((gameId, onFinish, onCancel) => {
    stacksService.joinGame(gameId,
      (payload) => {
        setActiveGameId(gameId);
        setGameStarted(true);
        onFinish?.(payload);
      },
      onCancel,
    );
  }, [setActiveGameId, setGameStarted]);

  const submitMove = useCallback((moveStr, boardState, onFinish, onCancel) => {
    if (!activeGameId) return;
    stacksService.submitMove(activeGameId, moveStr, boardState, onFinish, onCancel);
  }, [activeGameId]);

  const resign = useCallback((onFinish, onCancel) => {
    if (!activeGameId) return;
    stacksService.resignGame(activeGameId, onFinish, onCancel);
  }, [activeGameId]);

  return { createGame, joinGame, submitMove, resign, activeGameId, address };
}
