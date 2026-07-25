import arbiter from "../arbiter/arbiter";
import { getPieces } from "../arbiter/getMoves";
import type { Position, PieceColor, CastleRights, Coordinate, Piece } from "../../types/chess";

interface ComputerMoveParams {
  position: Position;
  turn: PieceColor;
  castleDirection: CastleRights;
}

interface ComputerMove {
  piece: Piece;
  rank: number;
  file: number;
  x: number;
  y: number;
}

/**
 * Get a move for the computer player
 * Currently uses random move selection
 * @returns A random valid move or null if no moves available
 */
export const getComputerMove = ({
  position,
  turn,
  castleDirection
}: ComputerMoveParams): ComputerMove | null => {
  const computerPieces = getPieces(position, turn);
  const allPossibleMoves: ComputerMove[] = [];

  computerPieces.forEach(p => {
    const validMoves = arbiter.getValidMoves({
      position,
      castleDirection,
      piece: p.piece,
      rank: p.rank,
      file: p.file,
    });

    validMoves.forEach(([x, y]: Coordinate) => {
      allPossibleMoves.push({
        piece: p.piece,
        rank: p.rank,
        file: p.file,
        x,
        y,
      });
    });
  });

  if (allPossibleMoves.length === 0) {
    return null; // No moves available
  }

  // Pick a random valid move
  const randomIndex = Math.floor(Math.random() * allPossibleMoves.length);
  return allPossibleMoves[randomIndex];
};
