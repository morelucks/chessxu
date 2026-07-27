import { puzzleFENs } from './puzzles';
import type { Position } from '../types/chess';

/**
 * Convert file number to character (a-h)
 */
export const getCharacter = (file: number): string => String.fromCharCode(file + 96);

/**
 * Create initial chess position
 */
export const createPosition = (): Position => {
  const position: Position = new Array(8).fill("").map(() => new Array(8).fill(""));

  for (let i = 0; i < 8; i++) {
    position[6][i] = "bp";
    position[1][i] = "wp";
  }

  position[0][0] = "wr";
  position[0][1] = "wn";
  position[0][2] = "wb";
  position[0][3] = "wq";
  position[0][4] = "wk";
  position[0][5] = "wb";
  position[0][6] = "wn";
  position[0][7] = "wr";

  position[7][0] = "br";
  position[7][1] = "bn";
  position[7][2] = "bb";
  position[7][3] = "bq";
  position[7][4] = "bk";
  position[7][5] = "bb";
  position[7][6] = "bn";
  position[7][7] = "br";

  return position;
};

/**
 * Deep copy a chess position
 */
export const copyPosition = (position: Position): Position => {
  const newPosition: Position = new Array(8).fill("").map(() => new Array(8).fill(""));

  for (let rank = 0; rank < position.length; rank++) {
    for (let file = 0; file < position[0].length; file++) {
      newPosition[rank][file] = position[rank][file];
    }
  }

  return newPosition;
};

/**
 * Check if two squares are the same color
 */
export const areSameColorTiles = (
  coords1: { x: number; y: number },
  coords2: { x: number; y: number }
): boolean => (coords1.x + coords1.y) % 2 === (coords2.x + coords2.y) % 2;

/**
 * Find all coordinates of a specific piece type
 */
export const findPieceCoords = (position: Position, type: string): Array<{ x: number; y: number }> => {
  const results: Array<{ x: number; y: number }> = [];
  position.forEach((rank, i) => {
    rank.forEach((pos, j) => {
      if (pos === type) results.push({ x: i, y: j });
    });
  });
  return results;
};

/**
 * Generate move notation (algebraic notation)
 */
export const getNewMoveNotation = ({
  piece,
  rank,
  file,
  x,
  y,
  position,
  promotesTo,
}: {
  piece: string;
  rank: number | string;
  file: number | string;
  x: number;
  y: number;
  position: Position;
  promotesTo?: string;
}): string => {
  let note = "";

  const rankNum = Number(rank);
  const fileNum = Number(file);
  
  if (piece[1] === "k" && Math.abs(fileNum - y) === 2) {
    if (fileNum < y) return "O-O";
    else return "O-O-O";
  }

  if (piece[1] !== "p") {
    note += piece[1].toUpperCase();
    if (position[x][y]) {
      note += "x";
    }
  } else if (rankNum !== x && fileNum !== y) {
    note += getCharacter(fileNum + 1) + "x";
  }

  note += getCharacter(y + 1) + (x + 1);

  if (promotesTo) note += "=" + promotesTo.toUpperCase();

  return note;
};

/**
 * Create a random puzzle position from FEN
 */
export const createPuzzlePosition = (): Position => {
  const randomIndex = Math.floor(Math.random() * puzzleFENs.length);
  const fen = puzzleFENs[randomIndex];
  
  const position: Position = new Array(8).fill("").map(() => new Array(8).fill(""));
  const boardPart = fen.split(" ")[0];
  const rows = boardPart.split("/");
  
  for (let i = 0; i < 8; i++) {
    const rankIndex = 7 - i; 
    let fileIndex = 0;
    for (const char of rows[i]) {
      if (!isNaN(Number(char))) {
        fileIndex += parseInt(char, 10);
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const pieceType = char.toLowerCase();
        position[rankIndex][fileIndex] = color + pieceType;
        fileIndex++;
      }
    }
  }
  return position;
};
