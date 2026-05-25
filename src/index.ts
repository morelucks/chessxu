export const CHESSXU_DEPLOYER = "SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B";

export const CONTRACTS = {
  TRAIT: `${CHESSXU_DEPLOYER}.sip-010-trait-ft-standard`,
  TOKEN: `${CHESSXU_DEPLOYER}.chessxu-token`,
  GAME: `${CHESSXU_DEPLOYER}.chessxu`,
};

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

export const GAME_STATUS = {
  WAITING: 0,
  ONGOING: 1,
  WHITE_WINS: 2,
  BLACK_WINS: 3,
  DRAW: 4,
  CANCELLED: 5,
};

export interface Game {
  playerW: string;
  playerB?: string;
  wager: number;
  isStx: boolean;
  boardState: string;
  turn: "w" | "b";
  status: number;
}

// ---------------------------------------------------------------------------
// Contract identifier helpers
// ---------------------------------------------------------------------------

/** A fully-qualified Stacks contract identifier: `<address>.<contract-name>`. */
export type ContractId = `${string}.${string}`;

/**
 * Split a fully-qualified contract identifier into its address and name parts.
 * Throws if the identifier is not of the form `<address>.<contract-name>`.
 */
export function parseContractId(id: string): { address: string; name: string } {
  const dot = id.indexOf(".");
  if (dot <= 0 || dot === id.length - 1) {
    throw new Error(`Invalid contract identifier: "${id}"`);
  }
  return { address: id.slice(0, dot), name: id.slice(dot + 1) };
}

/** Return just the deployer address part of a contract identifier. */
export function getContractAddress(id: string): string {
  return parseContractId(id).address;
}

/** Return just the contract-name part of a contract identifier. */
export function getContractName(id: string): string {
  return parseContractId(id).name;
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/** Reverse lookup of {@link ERRORS}: maps a numeric error code to its name. */
export const ERROR_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(ERRORS).map(([name, code]) => [code, name])
);

/** Resolve a contract error code to its `ERR_*` name, or `undefined` if unknown. */
export function getErrorName(code: number): string | undefined {
  return ERROR_NAMES[code];
}

/** Whether the given code is a known Chessxu contract error. */
export function isKnownError(code: number): boolean {
  return code in ERROR_NAMES;
}

/** Human-readable descriptions for each contract error code. */
export const ERROR_MESSAGES: Record<number, string> = {
  [ERRORS.ERR_NOT_OWNER]: "Caller is not the contract owner",
  [ERRORS.ERR_GAME_EXISTS]: "A game with this id already exists",
  [ERRORS.ERR_GAME_NOT_FOUND]: "No game exists with this id",
  [ERRORS.ERR_NOT_WAITING]: "Game is not waiting for an opponent",
  [ERRORS.ERR_ALREADY_JOINED]: "Player has already joined this game",
  [ERRORS.ERR_INVALID_WAGER]: "Wager amount is invalid",
  [ERRORS.ERR_NOT_PLAYER]: "Caller is not a player in this game",
  [ERRORS.ERR_NOT_YOUR_TURN]: "It is not the caller's turn to move",
  [ERRORS.ERR_GAME_NOT_ACTIVE]: "Game is not currently active",
  [ERRORS.ERR_INVALID_STATUS]: "Game status transition is invalid",
};

/**
 * Resolve a contract error code to a human-readable message. Falls back to a
 * generic message that still surfaces the raw code for unknown errors.
 */
export function getErrorMessage(code: number): string {
  return ERROR_MESSAGES[code] ?? `Unknown contract error (code ${code})`;
}

// ---------------------------------------------------------------------------
// Game-status helpers
// ---------------------------------------------------------------------------

/** Reverse lookup of {@link GAME_STATUS}: maps a status code to its name. */
export const STATUS_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(GAME_STATUS).map(([name, code]) => [code, name])
);

/** Whether a number is one of the defined {@link GAME_STATUS} values. */
export function isValidGameStatus(status: number): boolean {
  return status in STATUS_NAMES;
}

/** Resolve a status code to its name, or `undefined` if not a valid status. */
export function getStatusName(status: number): string | undefined {
  return STATUS_NAMES[status];
}

/** Whether the game is open and waiting for a second player to join. */
export function isAwaitingOpponent(status: number): boolean {
  return status === GAME_STATUS.WAITING;
}

/** Whether the game is in progress (joined and not yet finished). */
export function isGameActive(status: number): boolean {
  return status === GAME_STATUS.ONGOING;
}

/** Whether the game has reached a terminal state (win, draw or cancelled). */
export function isGameOver(status: number): boolean {
  return (
    status === GAME_STATUS.WHITE_WINS ||
    status === GAME_STATUS.BLACK_WINS ||
    status === GAME_STATUS.DRAW ||
    status === GAME_STATUS.CANCELLED
  );
}

/** The outcome of a finished game from the perspective of the result, if any. */
export type GameOutcome = "white" | "black" | "draw" | null;

/**
 * Resolve the winner of a game from its status. Returns `"white"` / `"black"`
 * for a decisive result, `"draw"` for a draw, and `null` while the game is
 * still waiting, ongoing, or was cancelled without a result.
 */
export function getWinner(status: number): GameOutcome {
  switch (status) {
    case GAME_STATUS.WHITE_WINS:
      return "white";
    case GAME_STATUS.BLACK_WINS:
      return "black";
    case GAME_STATUS.DRAW:
      return "draw";
    default:
      return null;
  }
}

/** A short, human-readable summary of a game's current status. */
export function gameResultText(status: number): string {
  switch (status) {
    case GAME_STATUS.WAITING:
      return "Waiting for opponent";
    case GAME_STATUS.ONGOING:
      return "Game in progress";
    case GAME_STATUS.WHITE_WINS:
      return "White wins";
    case GAME_STATUS.BLACK_WINS:
      return "Black wins";
    case GAME_STATUS.DRAW:
      return "Draw";
    case GAME_STATUS.CANCELLED:
      return "Game cancelled";
    default:
      return `Unknown status (${status})`;
  }
}

// ---------------------------------------------------------------------------
// Player and turn helpers
// ---------------------------------------------------------------------------

/** A player's colour, matching {@link Game.turn}. */
export type PlayerColor = "w" | "b";

/** Return the opposing colour. */
export function opponentOf(color: PlayerColor): PlayerColor {
  return color === "w" ? "b" : "w";
}

/**
 * Determine which colour an address plays in a game, or `null` if the address
 * is not one of the two players.
 */
export function colorOf(game: Game, address: string): PlayerColor | null {
  if (game.playerW === address) return "w";
  if (game.playerB === address) return "b";
  return null;
}

/** Whether the given address is one of the two players in the game. */
export function isPlayer(game: Game, address: string): boolean {
  return colorOf(game, address) !== null;
}

/**
 * Whether it is the given address's turn to move. Requires the game to be
 * active and the address to be the player whose colour matches `game.turn`.
 */
export function isPlayersTurn(game: Game, address: string): boolean {
  if (!isGameActive(game.status)) return false;
  return colorOf(game, address) === game.turn;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Stacks address shape: a version prefix (`SP`/`SM` mainnet, `ST`/`SN`
 * testnet) followed by Crockford base32 characters (which omit I, L, O and U).
 * This is a cheap structural check, not a checksum validation.
 */
const STACKS_ADDRESS_REGEX = /^S[PMNT][0-9A-HJKMNP-TV-Z]{38,40}$/;

/** Whether a string is structurally a valid Stacks (standard) address. */
export function isValidStacksAddress(address: string): boolean {
  return STACKS_ADDRESS_REGEX.test(address);
}

/**
 * Whether a wager is a valid on-chain amount: a positive, safe integer number
 * of base units. Zero is rejected (use {@link GAME_STATUS} flows for free
 * games) as are fractional or negative amounts.
 */
export function isValidWager(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount > 0;
}

/** Assert a wager is valid, throwing a descriptive error otherwise. */
export function assertValidWager(amount: number): void {
  if (!isValidWager(amount)) {
    throw new Error(
      `Invalid wager: expected a positive integer of base units, got ${amount}`
    );
  }
}

// ---------------------------------------------------------------------------
// Token amount helpers (CHESS, SIP-010, 6 decimals)
// ---------------------------------------------------------------------------

/** Number of decimal places the CHESS token uses. */
export const CHESS_DECIMALS = 6;

/** One whole CHESS expressed in base units. */
export const ONE_CHESS = 10 ** CHESS_DECIMALS;

/**
 * Format an integer amount of base units as a human-readable CHESS string,
 * trimming trailing zeros in the fractional part (e.g. `1500000` -> `"1.5"`).
 */
export function formatChess(baseUnits: number): string {
  if (!Number.isSafeInteger(baseUnits)) {
    throw new Error(`Expected integer base units, got ${baseUnits}`);
  }
  const negative = baseUnits < 0;
  const abs = Math.abs(baseUnits);
  const whole = Math.floor(abs / ONE_CHESS);
  const frac = abs % ONE_CHESS;
  const fracStr = frac.toString().padStart(CHESS_DECIMALS, "0").replace(/0+$/, "");
  const body = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return negative ? `-${body}` : body;
}

/**
 * Parse a decimal CHESS string (e.g. `"1.5"`) into an integer number of base
 * units. Rejects malformed input and amounts with more than
 * {@link CHESS_DECIMALS} fractional digits.
 */
export function parseChess(value: string): number {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid CHESS amount: "${value}"`);
  }
  const [, sign, whole, frac = ""] = match;
  if (frac.length > CHESS_DECIMALS) {
    throw new Error(
      `Too many decimal places: CHESS supports at most ${CHESS_DECIMALS}`
    );
  }
  const fracPadded = frac.padEnd(CHESS_DECIMALS, "0");
  const baseUnits = Number(whole) * ONE_CHESS + Number(fracPadded);
  return sign === "-" ? -baseUnits : baseUnits;
}

// ---------------------------------------------------------------------------
// Explorer URL helpers (Hiro explorer, mainnet)
// ---------------------------------------------------------------------------

/** Base URL of the Hiro Stacks explorer. */
export const EXPLORER_BASE_URL = "https://explorer.hiro.so";

/** Build an explorer link for a transaction id. */
export function txExplorerUrl(txid: string): string {
  const id = txid.startsWith("0x") ? txid : `0x${txid}`;
  return `${EXPLORER_BASE_URL}/txid/${id}?chain=mainnet`;
}

/** Build an explorer link for an account or contract address. */
export function addressExplorerUrl(address: string): string {
  return `${EXPLORER_BASE_URL}/address/${address}?chain=mainnet`;
}

// ---------------------------------------------------------------------------
// Clarity error response helpers
// ---------------------------------------------------------------------------

/**
 * Extract a numeric error code from a Clarity error representation such as
 * `"(err u102)"` or a bare `"u102"`. Returns `null` if no code is found.
 */
export function parseClarityErrorCode(value: string): number | null {
  const match = /u(\d+)/.exec(value);
  return match ? Number(match[1]) : null;
}

/**
 * Describe a contract error code as `"ERR_NAME: message"`, or just the
 * fallback message for unknown codes.
 */
export function describeError(code: number): string {
  const name = getErrorName(code);
  const message = getErrorMessage(code);
  return name ? `${name}: ${message}` : message;
}

/**
 * A typed error wrapping a Chessxu contract error code. Carries the numeric
 * `code` and (when known) the `name` alongside a human-readable message.
 */
export class ChessxuError extends Error {
  readonly code: number;
  readonly name: string;

  constructor(code: number) {
    super(getErrorMessage(code));
    this.code = code;
    this.name = getErrorName(code) ?? "ChessxuError";
  }

  /** Build a {@link ChessxuError} from a Clarity error string, or return null. */
  static fromClarity(value: string): ChessxuError | null {
    const code = parseClarityErrorCode(value);
    return code === null ? null : new ChessxuError(code);
  }
}
