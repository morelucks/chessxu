import useAppStore from '../zustand/store';
import { OnChainGameState } from '../types/chess';

export const useStacksChess = () => {
  const address = useAppStore((state) => state.address);

  const createGame = async (wager: number, isStxMode: boolean) => {
    console.log('Stub createGame called:', wager, isStxMode);
  };

  const joinGame = async (gameId: number, wager: number, isStxMode: boolean) => {
    console.log('Stub joinGame called:', gameId, wager, isStxMode);
  };

  const submitMove = async (gameId: number, move: string, boardState: string) => {
    console.log('Stub submitMove called:', gameId, move, boardState);
  };

  const resign = async (gameId: number) => {
    console.log('Stub resign called:', gameId);
  };

  const getGame = async (gameId: number) => {
    console.log('Stub getGame called:', gameId);
    return null;
  };

  const getLastGameId = async () => {
    return 0;
  };

  const getTokenBalance = async (userAddress: string) => {
    console.log('Stub getTokenBalance called:', userAddress);
    return 0;
  };

  const getPlayerStats = async (playerAddress: string) => {
    console.log('Stub getPlayerStats called:', playerAddress);
    return null;
  };

  const getPlayerElo = async (playerAddress: string) => {
    console.log('Stub getPlayerElo called:', playerAddress);
    return 1200;
  };

  const getGlobalStats = async () => {
    return null;
  };

  const getExpectedScore = async (playerA: string, playerB: string) => {
    console.log('Stub getExpectedScore called:', playerA, playerB);
    return 500;
  };

  const getWinProbability = (rawScore: number) => {
    return `${(rawScore / 10).toFixed(1)}%`;
  };

  const formatElo = (elo: number | null | undefined) => {
    return elo?.toString() || '1200';
  };

  const handleContractError = (error: string) => {
    return error;
  };

  const resolveGame = async (gameId: number, newStatus: number) => {
    console.log('Stub resolveGame called:', gameId, newStatus);
  };

  const isPlayerWhite = (game: OnChainGameState | null | undefined, playerAddress: string) =>
    game?.['player-w'] === playerAddress;
  const isPlayerBlack = (game: OnChainGameState | null | undefined, playerAddress: string) =>
    typeof game?.['player-b'] === 'object'
      ? game?.['player-b']?.value === playerAddress
      : game?.['player-b'] === playerAddress;

  const getGameStatusString = (status: number) => {
    switch (status) {
      case 0: return 'Waiting for Opponent';
      case 1: return 'Game in Progress';
      case 2: return 'White Wins';
      case 3: return 'Black Wins';
      case 4: return 'Draw';
      case 5: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const isGameActive = (status: number) => status === 1;
  const isWaitingForOpponent = (status: number) => status === 0;

  const getWagerDisplay = (wager: number, isStx: boolean) => {
    if (isStx) return `${wager / 1000000} STX`;
    return `${wager / 1000000} CHESS`;
  };

  const isMyTurn = (game: OnChainGameState | null | undefined, playerAddress: string) => {
    if (!game || !playerAddress) return false;
    const currentTurn = typeof game.turn === 'string' ? game.turn : game.turn?.value;
    const isWhite = isPlayerWhite(game, playerAddress);
    const isBlack = isPlayerBlack(game, playerAddress);
    return (currentTurn === 'w' && isWhite) || (currentTurn === 'b' && isBlack);
  };

  const getOpponentAddress = (game: OnChainGameState | null | undefined, playerAddress: string) => {
    if (!game || !playerAddress) return null;
    const isWhite = isPlayerWhite(game, playerAddress);
    const playerB = typeof game['player-b'] === 'object' ? game['player-b']?.value : game['player-b'];
    return isWhite ? (playerB || null) : (game['player-w'] || null);
  };

  return { 
    address, 
    network: null, 
    createGame, 
    joinGame, 
    submitMove, 
    resign, 
    getGame, 
    getLastGameId,
    getTokenBalance,
    getPlayerStats,
    getPlayerElo,
    getGlobalStats,
    getExpectedScore,
    resolveGame,
    isPlayerWhite,
    isPlayerBlack,
    getGameStatusString,
    isGameActive,
    isWaitingForOpponent,
    getWagerDisplay,
    isMyTurn,
    getOpponentAddress,
    getWinProbability,
    formatElo,
    handleContractError
  };
};
