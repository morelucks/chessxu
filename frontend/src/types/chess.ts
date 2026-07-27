/**
 * Chess Type Definitions
 * Core types for the chess engine and game state
 */

/**
 * Piece color - white or black
 */
export type PieceColor = 'w' | 'b';

/**
 * Piece type without color prefix
 */
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/**
 * Full piece notation (color + type)
 * Examples: 'wp' (white pawn), 'bk' (black king)
 */
export type Piece = `${PieceColor}${PieceType}`;

/**
 * Board position - 8x8 grid of piece strings or empty strings
 */
export type Position = string[][];

/**
 * Coordinate on the chess board [rank, file]
 * rank: 0-7 (row), file: 0-7 (column)
 */
export type Coordinate = [number, number];

/**
 * Castling direction options
 */
export type CastleDirection = 'left' | 'right' | 'both' | 'none';

/**
 * Castling rights for both players
 */
export interface CastleRights {
  w: CastleDirection;
  b: CastleDirection;
}

/**
 * Represents a move on the board
 */
export interface Move {
  piece: Piece;
  from: Coordinate;
  to: Coordinate;
  capture?: Piece;
  promotion?: PieceType;
  castling?: boolean;
  enPassant?: boolean;
}

/**
 * Promotion square coordinates and metadata
 */
export interface PromotionSquare {
  rank: number;
  file: number;
  x: number;
  y: number;
}

/**
 * Game status values
 */
export const Status = {
  ongoing: 'Ongoing',
  promoting: 'Promoting',
  white: 'White wins',
  black: 'Black wins',
  stalemate: 'Game draws due to stalemate',
  insufficient: 'Game draws due to insufficient material',
} as const;

export type GameStatus = typeof Status[keyof typeof Status];

/**
 * Game mode types
 */
export type GameMode = 'pvc' | 'pvp' | 'puzzle';

/**
 * Represents the local client-side game state
 */
export interface GameState {
  position: Position[];
  turn: PieceColor;
  candidateMoves: Coordinate[];
  movesList: string[];
  promotionSquare: PromotionSquare | null;
  status: GameStatus;
  castleDirection: CastleRights;
  points: {
    w: number;
    b: number;
  };
  gameMode: GameMode;
  playerColor?: PieceColor;
  whiteTimeMs?: number | null;
  blackTimeMs?: number | null;
  timeoutWinner?: PieceColor;
  selectedPiece?: {
    piece: Piece;
    rank: number;
    file: number;
  } | null;
}

export interface OnChainGameState {
  status: number | string;
  turn?: { value: string } | string;
  'player-w'?: string;
  'player-b'?: { value: string } | null;
  'last-move'?: { value: string } | null;
}

/**
 * Represents the player stake details.
 */
export interface StakeData {
  amount: string | number;
  isStx: boolean;
  status?: string;
  id?: number;
  savedAt?: string;
  updatedAt?: number;
}

/**
 * Represents a result entry in the leaderboard.
 */
export interface LeaderboardResult {
  name: string;
  score: number;
  winner?: string;
}

/**
 * Props for the GameModeSelection component.
 */
export interface GameModeSelectionProps {
  gameMode: string;
  onNewGame: (mode: string) => void;
  onShowStakingModal: (show: boolean) => void;
}

/**
 * Props for the StakeSection component.
 */
export interface StakeSectionProps {
  appState: GameState;
}
