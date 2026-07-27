import { areSameColorTiles, findPieceCoords } from '../helper';
import {
  getKnightMoves,
  getRookMoves,
  getBishopMoves,
  getQueenMoves,
  getKingMoves,
  getPawnMoves,
  getPawnCaptures,
  getCastlingMoves,
  getPieces,
  getKingPosition
} from './getMoves';
import { movePiece, movePawn } from './move';
import type { Position, Piece, PieceColor, Coordinate, CastleRights } from '../../types/chess';

interface MoveParams {
  position: Position;
  piece: Piece;
  rank: number;
  file: number;
}

interface ValidMovesParams extends MoveParams {
  castleDirection: CastleRights;
  prevPosition?: Position;
}

interface CheckParams {
  positionAfterMove: Position;
  position?: Position;
  player: PieceColor | string;
}

interface PerformMoveParams extends MoveParams {
  x: number;
  y: number;
}

/**
 * Chess arbiter - validates moves and checks game rules
 */
const arbiter = {
  /**
   * Get all regular (non-special) moves for a piece
   */
  getRegularMoves({ position, piece, rank, file }: MoveParams): Coordinate[] {
    if (piece.endsWith('n')) return getKnightMoves({ position, rank, file });
    if (piece.endsWith('b')) return getBishopMoves({ position, piece, rank, file });
    if (piece.endsWith('r')) return getRookMoves({ position, piece, rank, file });
    if (piece.endsWith('q')) return getQueenMoves({ position, piece, rank, file });
    if (piece.endsWith('k')) return getKingMoves({ position, piece, rank, file });
    if (piece.endsWith('p')) return getPawnMoves({ position, piece, rank, file });
    return [];
  },

  /**
   * Get all valid moves (excluding moves that would put own king in check)
   */
  getValidMoves({ position, castleDirection, prevPosition, piece, rank, file }: ValidMovesParams): Coordinate[] {
    let moves = this.getRegularMoves({ position, piece, rank, file });
    const notInCheckMoves: Coordinate[] = [];

    // Add pawn captures
    if (piece.endsWith('p')) {
      moves = [
        ...moves,
        ...getPawnCaptures({ position, prevPosition, piece, rank, file })
      ];
    }

    // Add castling moves
    if (piece.endsWith('k')) {
      const playerColor = piece[0] as PieceColor;
      moves = [
        ...moves,
        ...getCastlingMoves({ position, castleDirection: castleDirection[playerColor], piece, rank, file })
      ];
    }

    // Filter out moves that would capture enemy king (illegal)
    const enemy: PieceColor = piece[0] === 'w' ? 'b' : 'w';
    moves = moves.filter(([x, y]) => {
      const target = position?.[x]?.[y];
      return !(target && target.startsWith(enemy) && target.endsWith('k'));
    });

    // Filter moves that would leave own king in check
    moves.forEach(([x, y]) => {
      const positionAfterMove = this.performMove({ position, piece, rank, file, x, y });
      if (!this.isPlayerInCheck({ positionAfterMove, position, player: piece[0] })) {
        notInCheckMoves.push([x, y]);
      }
    });

    return notInCheckMoves;
  },

  /**
   * Check if a player is in check
   */
  isPlayerInCheck({ positionAfterMove, position, player }: CheckParams): boolean {
    const playerColor = player.startsWith('w') ? 'w' : 'b';
    const enemy: PieceColor = playerColor === 'w' ? 'b' : 'w';
    const kingPos = getKingPosition(positionAfterMove, playerColor);

    // If king not found, treat as in check
    if (!kingPos) return true;

    const enemyPieces = getPieces(positionAfterMove, enemy);

    const enemyMoves = enemyPieces.reduce<Coordinate[]>((acc, p) => {
      const pieceMoves = p.piece.endsWith('p')
        ? getPawnCaptures({
            position: positionAfterMove,
            prevPosition: position,
            ...p
          })
        : this.getRegularMoves({
            position: positionAfterMove,
            ...p
          });
      return [...acc, ...pieceMoves];
    }, []);

    return enemyMoves.some(([x, y]) => kingPos[0] === x && kingPos[1] === y);
  },

  /**
   * Perform a move on the board
   */
  performMove({ position, piece, rank, file, x, y }: PerformMoveParams): Position {
    if (piece.endsWith('p')) {
      return movePawn({ position, piece, rank, file, x, y });
    }
    return movePiece({ position, piece, rank, file, x, y });
  },

  /**
   * Check if the position is a stalemate
   */
  isStalemate(position: Position, player: PieceColor | string, castleDirection: CastleRights): boolean {
    const playerColor = player.startsWith('w') ? 'w' : 'b';
    const isInCheck = this.isPlayerInCheck({ positionAfterMove: position, player: playerColor });

    if (isInCheck) return false;

    const pieces = getPieces(position, playerColor);
    const moves = pieces.reduce<Coordinate[]>((acc, p) => {
      const validMoves = this.getValidMoves({
        position,
        castleDirection,
        ...p
      });
      return [...acc, ...validMoves];
    }, []);

    return !isInCheck && moves.length === 0;
  },

  /**
   * Check if the position has insufficient material for checkmate
   */
  insufficientMaterial(position: Position): boolean {
    const pieces = position.reduce<string[]>((acc, rank) => {
      return [...acc, ...rank.filter(spot => spot)];
    }, []);

    // King vs king
    if (pieces.length === 2) return true;

    // King and bishop/knight vs king
    if (pieces.length === 3 && pieces.some(p => p.endsWith('b') || p.endsWith('n'))) {
      return true;
    }

    // King and bishop vs king and bishop (same color squares)
    if (
      pieces.length === 4 &&
      pieces.every(p => p.endsWith('b') || p.endsWith('k')) &&
      new Set(pieces).size === 4
    ) {
      const whiteBishopCoords = findPieceCoords(position, 'wb')[0];
      const blackBishopCoords = findPieceCoords(position, 'bb')[0];
      if (whiteBishopCoords && blackBishopCoords) {
        return areSameColorTiles(whiteBishopCoords, blackBishopCoords);
      }
    }

    return false;
  },

  /**
   * Check if the position is checkmate
   */
  isCheckMate(position: Position, player: PieceColor | string, castleDirection: CastleRights): boolean {
    const playerColor = player.startsWith('w') ? 'w' : 'b';
    const isInCheck = this.isPlayerInCheck({ positionAfterMove: position, player: playerColor });

    if (!isInCheck) return false;

    const pieces = getPieces(position, playerColor);
    const moves = pieces.reduce<Coordinate[]>((acc, p) => {
      const validMoves = this.getValidMoves({
        position,
        castleDirection,
        ...p
      });
      return [...acc, ...validMoves];
    }, []);

    return isInCheck && moves.length === 0;
  },
};

export default arbiter;
