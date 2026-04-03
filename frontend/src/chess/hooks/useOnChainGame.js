import { useCallback } from 'react';
import stacksService from '../services/stacksService';
import useAppStore from '../../zustand/store';
import { useToaster } from '../../components/ui/toasts/ToasterProvider';

/**
 * Provides contract call helpers bound to the connected wallet.
 * All functions open the Stacks wallet popup for signing.
 */
export function useOnChainGame() {
  const { activeGameId, setActiveGameId, setGameStarted, address } = useAppStore();
  const { addToast } = useToaster();

  const createGame = useCallback((wager, isStx, onFinish, onCancel) => {
    stacksService.createGame(wager, isStx,
      async (payload) => {
        const txId = payload?.txId ?? '';
        addToast({ txId, status: 'pending', message: 'Creating game on-chain...' });
        const lastId = await stacksService.getLastGameId();
        setActiveGameId(lastId);
        setGameStarted(true);
        onFinish?.(payload);
      },
      onCancel,
    );
  }, [setActiveGameId, setGameStarted, addToast]);

  const joinGame = useCallback((gameId, onFinish, onCancel) => {
    stacksService.joinGame(gameId,
      (payload) => {
        const txId = payload?.txId ?? '';
        addToast({ txId, status: 'pending', message: `Joining game #${gameId}...` });
        setActiveGameId(gameId);
        setGameStarted(true);
        onFinish?.(payload);
      },
      onCancel,
    );
  }, [setActiveGameId, setGameStarted, addToast]);

  const submitMove = useCallback((moveStr, boardState, onFinish, onCancel) => {
    if (!activeGameId) return;
    stacksService.submitMove(activeGameId, moveStr, boardState,
      (payload) => {
        addToast({ txId: payload?.txId ?? '', status: 'pending', message: `Move submitted` });
        onFinish?.(payload);
      },
      onCancel,
    );
  }, [activeGameId, addToast]);

  const resign = useCallback((onFinish, onCancel) => {
    if (!activeGameId) return;
    stacksService.resignGame(activeGameId,
      (payload) => {
        addToast({ txId: payload?.txId ?? '', status: 'pending', message: 'Resignation submitted' });
        onFinish?.(payload);
      },
      onCancel,
    );
  }, [activeGameId, addToast]);

  return { createGame, joinGame, submitMove, resign, activeGameId, address };
}
