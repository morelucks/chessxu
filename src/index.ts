/**
 * The deployer address for the Chessxu smart contracts on Stacks Mainnet.
 */
export const CHESSXU_DEPLOYER = "SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B";

/**
 * Standard contract identifiers for the Chessxu ecosystem.
 */
export const CONTRACTS = {
  /** The SIP-010 fungible token trait used by the game */
  TRAIT: `${CHESSXU_DEPLOYER}.sip-010-trait-ft-standard`,
  /** The native CHESS utility token */
  TOKEN: `${CHESSXU_DEPLOYER}.chessxu-token`,
  /** The core state-machine game contract */
  GAME: `${CHESSXU_DEPLOYER}.chessxu`,
};

/**
 * Standard error codes emitted by the `chessxu.clar` smart contract.
 */
export const ERRORS = {
  ERR_NOT_OWNER: 100,
  ERR_GAME_EXISTS: 101,
  ERR_GAME_NOT_FOUND: 102,
  ERR_NOT_WAITING: 103,
  ERR_ALREADY_JOINED: 104,
  ERR_INVALID_WAGER: 105,
  ERR_NOT_PLAYER: 106,
  ERR_NOT_YOUR_TURN: 107,
  ERR_GAME_NOT_ACTIVE: 108,
  ERR_INVALID_STATUS: 109,
};

/**
 * Game state enum matching the Clarity contract uint values.
 */
export const GAME_STATUS = {
  WAITING: 0,
  ONGOING: 1,
  WHITE_WINS: 2,
  BLACK_WINS: 3,
  DRAW: 4,
  CANCELLED: 5,
};

/**
 * Represents the on-chain state of a Chessxu match.
 */
export interface Game {
  /** The Stacks address of the player controlling the White pieces */
  playerW: string;
  /** The Stacks address of the player controlling the Black pieces (undefined if waiting) */
  playerB?: string;
  /** The wager amount escrowed in the contract */
  wager: number;
  /** True if the wager is in micro-STX, false if in CHESS tokens */
  isStx: boolean;
  /** The current board state in ASCII representation */
  boardState: string;
  /** Whose turn it is currently ('w' for White, 'b' for Black) */
  turn: "w" | "b";
  /** The current status of the game (matches GAME_STATUS values) */
  status: number;
}
