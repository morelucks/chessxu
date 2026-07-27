import { copyPosition } from "../helper";
import type { Position, Piece } from "../../types/chess";

/**
 * Move a non-pawn piece on the board
 * Handles castling logic for king moves
 */
export const movePiece = ({
  position,
  piece,
  rank,
  file,
  x,
  y,
}: {
  position: Position;
  piece: Piece;
  rank: number;
  file: number;
  x: number;
  y: number;
}): Position => {
  const newPosition = copyPosition(position);

  // Handle castling
  if (piece.endsWith('k') && Math.abs(y - file) > 1) {
    if (y === 2) {
      // Castles queenside
      newPosition[rank][0] = '';
      newPosition[rank][3] = piece.startsWith('w') ? 'wr' : 'br';
    }
    if (y === 6) {
      // Castles kingside
      newPosition[rank][7] = '';
      newPosition[rank][5] = piece.startsWith('w') ? 'wr' : 'br';
    }
  }
  
  newPosition[rank][file] = '';
  newPosition[x][y] = piece;
  return newPosition;
};

/**
 * Move a pawn on the board
 * Handles en passant capture
 */
export const movePawn = ({
  position,
  piece,
  rank,
  file,
  x,
  y,
}: {
  position: Position;
  piece: Piece;
  rank: number;
  file: number;
  x: number;
  y: number;
}): Position => {
  const newPosition = copyPosition(position);

  // En passant: capturing an empty cell diagonally
  if (!newPosition[x][y] && x !== rank && y !== file) {
    newPosition[rank][y] = '';
  }

  newPosition[rank][file] = '';
  newPosition[x][y] = piece;
  return newPosition;
};
