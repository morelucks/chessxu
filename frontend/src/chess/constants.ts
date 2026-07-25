import { createPosition } from './helper';
import type { GameState, GameStatus, PieceColor, CastleDirection } from '../types/chess';

/**
 * Game status constants
 */
export const Status = {
    ongoing: 'Ongoing',
    promoting: 'Promoting',
    white: 'White wins',
    black: 'Black wins',
    stalemate: 'Game draws due to stalemate',
    insufficient: 'Game draws due to insufficient material',
} as const;

/**
 * Initial game state for a new chess game
 */
export const initGameState: GameState = {
    position: [createPosition()],
    turn: 'w' as PieceColor,
    candidateMoves: [],
    movesList: [],
    promotionSquare: null,
    status: Status.ongoing as GameStatus,
    castleDirection: {
        w: 'both' as CastleDirection,
        b: 'both' as CastleDirection,
    },
    points: {
        w: 0,
        b: 0,
    },
    gameMode: 'pvc',
    playerColor: 'w' as PieceColor,
};
