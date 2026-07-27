import arbiter from "./arbiter";
import type { Position, Piece, PieceColor, Coordinate, CastleDirection } from "../../types/chess";

interface PieceInfo {
  piece: Piece;
  rank: number;
  file: number;
}

interface MoveParams {
  position: Position;
  piece: Piece;
  rank: number;
  file: number;
}

/**
 * Get all valid rook moves
 */
export const getRookMoves = ({ position, piece, rank, file }: MoveParams): Coordinate[] => {
  const moves: Coordinate[] = [];
  const us = piece[0] as PieceColor;
  const enemy: PieceColor = us === 'w' ? 'b' : 'w';

  const direction: Coordinate[] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  direction.forEach(dir => {
    for (let i = 1; i <= 8; i++) {
      const x = rank + (i * dir[0]);
      const y = file + (i * dir[1]);
      if (position?.[x]?.[y] === undefined) break;
      if (position[x][y].startsWith(enemy)) {
        moves.push([x, y]);
        break;
      }
      if (position[x][y].startsWith(us)) break;
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Get all valid knight moves
 */
export const getKnightMoves = ({ position, rank, file }: Omit<MoveParams, 'piece'>): Coordinate[] => {
  const moves: Coordinate[] = [];
  const enemy: PieceColor = position[rank][file].startsWith('w') ? 'b' : 'w';

  const candidates: Coordinate[] = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];

  candidates.forEach(c => {
    const cell = position?.[rank + c[0]]?.[file + c[1]];
    if (cell !== undefined && (cell.startsWith(enemy) || cell === '')) {
      moves.push([rank + c[0], file + c[1]]);
    }
  });

  return moves;
};

/**
 * Get all valid bishop moves
 */
export const getBishopMoves = ({ position, piece, rank, file }: MoveParams): Coordinate[] => {
  const moves: Coordinate[] = [];
  const us = piece[0] as PieceColor;
  const enemy: PieceColor = us === 'w' ? 'b' : 'w';

  const direction: Coordinate[] = [
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  direction.forEach(dir => {
    for (let i = 1; i <= 8; i++) {
      const x = rank + (i * dir[0]);
      const y = file + (i * dir[1]);
      if (position?.[x]?.[y] === undefined) break;
      if (position[x][y].startsWith(enemy)) {
        moves.push([x, y]);
        break;
      }
      if (position[x][y].startsWith(us)) break;
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Get all valid queen moves (combination of rook and bishop)
 */
export const getQueenMoves = (params: MoveParams): Coordinate[] => {
  return [
    ...getBishopMoves(params),
    ...getRookMoves(params)
  ];
};

/**
 * Get all valid king moves
 */
export const getKingMoves = ({ position, piece, rank, file }: MoveParams): Coordinate[] => {
  const moves: Coordinate[] = [];
  const us = piece[0] as PieceColor;

  const direction: Coordinate[] = [
    [1, -1], [1, 0], [1, 1],
    [0, -1], [0, 1],
    [-1, -1], [-1, 0], [-1, 1],
  ];

  direction.forEach(dir => {
    const x = rank + dir[0];
    const y = file + dir[1];
    if (position?.[x]?.[y] !== undefined && !position[x][y].startsWith(us)) {
      moves.push([x, y]);
    }
  });

  return moves;
};

/**
 * Get all valid pawn moves (non-captures)
 */
export const getPawnMoves = ({ position, piece, rank, file }: MoveParams): Coordinate[] => {
  const moves: Coordinate[] = [];
  const dir = piece === 'wp' ? 1 : -1;

  // Move two squares on first move
  if (rank % 5 === 1) {
    if (position?.[rank + dir]?.[file] === '' && position?.[rank + dir + dir]?.[file] === '') {
      moves.push([rank + dir + dir, file]);
    }
  }

  // Move one square
  if (!position?.[rank + dir]?.[file]) {
    moves.push([rank + dir, file]);
  }

  return moves;
};

/**
 * Get all valid pawn captures including en passant
 */
export const getPawnCaptures = ({
  position,
  prevPosition,
  piece,
  rank,
  file
}: MoveParams & { prevPosition?: Position }): Coordinate[] => {
  const moves: Coordinate[] = [];
  const dir = piece === 'wp' ? 1 : -1;
  const enemy: PieceColor = piece[0] === 'w' ? 'b' : 'w';

  // Capture left
  if (position?.[rank + dir]?.[file - 1]?.startsWith(enemy)) {
    moves.push([rank + dir, file - 1]);
  }

  // Capture right
  if (position?.[rank + dir]?.[file + 1]?.startsWith(enemy)) {
    moves.push([rank + dir, file + 1]);
  }

  // En passant
  const enemyPawn = dir === 1 ? 'bp' : 'wp';
  const adjacentFiles = [file - 1, file + 1];

  if (prevPosition && ((dir === 1 && rank === 4) || (dir === -1 && rank === 3))) {
    adjacentFiles.forEach(f => {
      if (
        position?.[rank]?.[f] === enemyPawn &&
        position?.[rank + dir + dir]?.[f] === '' &&
        prevPosition?.[rank]?.[f] === '' &&
        prevPosition?.[rank + dir + dir]?.[f] === enemyPawn
      ) {
        moves.push([rank + dir, f]);
      }
    });
  }

  return moves;
};

/**
 * Get valid castling moves
 */
export const getCastlingMoves = ({
  position,
  castleDirection,
  piece,
  rank,
  file
}: MoveParams & { castleDirection: CastleDirection }): Coordinate[] => {
  const moves: Coordinate[] = [];

  if (file !== 4 || rank % 7 !== 0 || castleDirection === 'none') {
    return moves;
  }

  if (piece.startsWith('w')) {
    if (arbiter.isPlayerInCheck({ positionAfterMove: position, player: 'w' })) {
      return moves;
    }

    // Queenside castling
    if (
      ['left', 'both'].includes(castleDirection) &&
      !position[0][3] && !position[0][2] && !position[0][1] &&
      position[0][0] === 'wr' &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 0, y: 3 }),
        player: 'w'
      }) &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 0, y: 2 }),
        player: 'w'
      })
    ) {
      moves.push([0, 2]);
    }

    // Kingside castling
    if (
      ['right', 'both'].includes(castleDirection) &&
      !position[0][5] && !position[0][6] &&
      position[0][7] === 'wr' &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 0, y: 5 }),
        player: 'w'
      }) &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 0, y: 6 }),
        player: 'w'
      })
    ) {
      moves.push([0, 6]);
    }
  } else {
    if (arbiter.isPlayerInCheck({ positionAfterMove: position, player: 'b' })) {
      return moves;
    }

    // Queenside castling
    if (
      ['left', 'both'].includes(castleDirection) &&
      !position[7][3] && !position[7][2] && !position[7][1] &&
      position[7][0] === 'br' &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 7, y: 3 }),
        position,
        player: 'b'
      }) &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 7, y: 2 }),
        position,
        player: 'b'
      })
    ) {
      moves.push([7, 2]);
    }

    // Kingside castling
    if (
      ['right', 'both'].includes(castleDirection) &&
      !position[7][5] && !position[7][6] &&
      position[7][7] === 'br' &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 7, y: 5 }),
        position,
        player: 'b'
      }) &&
      !arbiter.isPlayerInCheck({
        positionAfterMove: arbiter.performMove({ position, piece, rank, file, x: 7, y: 6 }),
        position,
        player: 'b'
      })
    ) {
      moves.push([7, 6]);
    }
  }

  return moves;
};

/**
 * Determine new castling direction after a rook or king move
 */
export const getCastlingDirections = ({
  castleDirection,
  piece,
  file,
  rank
}: {
  castleDirection: Record<PieceColor, CastleDirection>;
  piece: Piece;
  file: number | string;
  rank: number | string;
}): CastleDirection | undefined => {
  const fileNum = Number(file);
  const rankNum = Number(rank);
  const direction = castleDirection[piece[0] as PieceColor];

  if (piece.endsWith('k')) return 'none';

  if (fileNum === 0 && rankNum === 0) {
    if (direction === 'both') return 'right';
    if (direction === 'left') return 'none';
  }
  if (fileNum === 7 && rankNum === 0) {
    if (direction === 'both') return 'left';
    if (direction === 'right') return 'none';
  }
  if (fileNum === 0 && rankNum === 7) {
    if (direction === 'both') return 'right';
    if (direction === 'left') return 'none';
  }
  if (fileNum === 7 && rankNum === 7) {
    if (direction === 'both') return 'left';
    if (direction === 'right') return 'none';
  }

  return undefined;
};

/**
 * Get all pieces of a specific color
 */
export const getPieces = (position: Position, player: PieceColor): PieceInfo[] => {
  const pieces: PieceInfo[] = [];
  position.forEach((rank, x) => {
    rank.forEach((file, y) => {
      if (position[x][y].startsWith(player)) {
        pieces.push({
          piece: position[x][y] as Piece,
          rank: x,
          file: y,
        });
      }
    });
  });
  return pieces;
};

/**
 * Get the position of the king for a specific player
 */
export const getKingPosition = (position: Position, player: PieceColor): Coordinate | null => {
  let kingPos: Coordinate | null = null;
  position.forEach((rank, x) => {
    rank.forEach((file, y) => {
      if (position[x][y].startsWith(player) && position[x][y].endsWith('k')) {
        kingPos = [x, y];
      }
    });
  });
  return kingPos;
};
