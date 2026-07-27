import { Status } from "../constants";
import actionTypes from "./actionTypes";
import { getComputerMove } from '../ai/chessAI';
import arbiter from '../arbiter/arbiter';
import { saveGameResult } from '../helper/localStorage';
import { createPosition, createPuzzlePosition } from '../helper';
import type { GameState, PieceColor, CastleDirection } from '../../types/chess';

interface Action {
  type: string;
  payload?: unknown;
}

/**
 * Chess game reducer - handles all game state transitions
 */
export const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case actionTypes.NEW_MOVE: {
      const { position, movesList, turn } = state;
      return {
        ...state,
        position: [...position, action.payload.newPosition],
        movesList: [...movesList, action.payload.newMove],
        turn: turn === 'w' ? 'b' : 'w',
      };
    }

    case actionTypes.GENERATE_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: action.payload.candidateMoves,
      };
    }

    case actionTypes.CLEAR_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: [],
        selectedPiece: null,
      };
    }

    case actionTypes.SELECT_PIECE: {
      return {
        ...state,
        selectedPiece: action.payload,
      };
    }

    case actionTypes.PROMOTION_OPEN: {
      return {
        ...state,
        status: Status.promoting,
        promotionSquare: { ...action.payload },
      };
    }

    case actionTypes.PROMOTION_CLOSE: {
      return {
        ...state,
        status: Status.ongoing,
        promotionSquare: null,
      };
    }

    case actionTypes.CAN_CASTLE: {
      const { turn, castleDirection } = state;
      const newCastleDirection = { ...castleDirection };
      newCastleDirection[turn] = action.payload;
      return {
        ...state,
        castleDirection: newCastleDirection,
      };
    }

    case actionTypes.STALEMATE: {
      const newPoints = { ...state.points };
      newPoints.w += 1;
      newPoints.b += 1;
      return {
        ...state,
        status: Status.stalemate,
        points: newPoints,
      };
    }

    case actionTypes.INSUFFICIENT_MATERIAL: {
      const newPoints = { ...state.points };
      newPoints.w += 1;
      newPoints.b += 1;
      return {
        ...state,
        status: Status.insufficient,
        points: newPoints,
      };
    }

    case actionTypes.WIN: {
      const winner: PieceColor = action.payload === 'w' ? 'w' : 'b';
      const newPoints = { ...state.points };
      newPoints[winner] += 3;
      return {
        ...state,
        status: action.payload === 'w' ? Status.white : Status.black,
        points: newPoints,
      };
    }

    case actionTypes.TIMEOUT: {
      const loser: PieceColor = action.payload;
      const winner: PieceColor = loser === 'w' ? 'b' : 'w';
      const newPoints = { ...state.points };
      newPoints[winner] += 3;
      return {
        ...state,
        status: winner === 'w' ? Status.white : Status.black,
        points: newPoints,
        timeoutWinner: winner,
      };
    }

    case actionTypes.UPDATE_TIME: {
      return {
        ...state,
        whiteTimeMs: action.payload.whiteTimeMs,
        blackTimeMs: action.payload.blackTimeMs,
      };
    }

    case actionTypes.NEW_GAME: {
      const isPuzzleMode = action.payload.gameMode === 'puzzle';
      const timeControlMs = action.payload.timeControlMs || null;
      return {
        position: [isPuzzleMode ? createPuzzlePosition() : createPosition()],
        turn: 'w' as PieceColor,
        candidateMoves: [],
        selectedPiece: null,
        movesList: [],
        promotionSquare: null,
        status: Status.ongoing,
        castleDirection: {
          w: 'both' as CastleDirection,
          b: 'both' as CastleDirection,
        },
        points: {
          w: 0,
          b: 0,
        },
        gameMode: action.payload.gameMode || 'pvc',
        playerColor: action.payload.playerColor || ('w' as PieceColor),
        whiteTimeMs: timeControlMs,
        blackTimeMs: timeControlMs,
      };
    }

    case actionTypes.TAKE_BACK: {
      let { position, movesList, turn } = state;
      if (position.length > 1) {
        position = position.slice(0, position.length - 1);
        movesList = movesList.slice(0, movesList.length - 1);
        turn = turn === 'w' ? 'b' : 'w';
      }
      return {
        ...state,
        position,
        movesList,
        turn,
      };
    }

    case actionTypes.COMPUTER_MOVE: {
      const { position, turn, castleDirection, movesList } = state;
      const computerMove = getComputerMove({
        position: position[position.length - 1],
        turn,
        castleDirection,
      });

      if (computerMove) {
        const { piece, rank, file, x, y } = computerMove;
        const newPosition = arbiter.performMove({
          position: position[position.length - 1],
          piece,
          rank,
          file,
          x,
          y,
        });
        return {
          ...state,
          position: [...position, newPosition],
          movesList: [...movesList, `${piece[1]}${file}${rank}-${y}${x}`],
          turn: turn === 'w' ? 'b' : 'w',
        };
      }

      return state;
    }

    case actionTypes.SAVE_GAME_RESULT: {
      const { gameMode, points, status } = state;
      const result = {
        mode: gameMode,
        winner:
          status === Status.white
            ? 'white'
            : status === Status.black
            ? 'black'
            : 'draw',
        whitePoints: points.w,
        blackPoints: points.b,
        date: new Date().toISOString(),
      };
      saveGameResult(result);
      return state;
    }

    default:
      return state;
  }
};
