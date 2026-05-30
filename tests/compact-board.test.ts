/**
 * compact-board.test.ts
 *
 * Tests for the v3 gas-optimization compact board-state helpers.
 * Verifies fenToCompact, compactToFen, isValidCompactBoardState,
 * isStartingPosition, and turnMatchesBoard with compact format.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STARTING_FEN,
  STARTING_BOARD_COMPACT,
  MAX_BOARD_STATE_LENGTH,
  fenToCompact,
  compactToFen,
  isValidCompactBoardState,
  isStartingPosition,
  activeColorFromFen,
  turnMatchesBoard,
  Game,
} from "../src/index";

// ─── Constants ───────────────────────────────────────────────────────────────

test("STARTING_BOARD_COMPACT is the piece-placement part of STARTING_FEN", () => {
  assert.equal(STARTING_BOARD_COMPACT, STARTING_FEN.split(" ")[0]);
});

test("STARTING_BOARD_COMPACT is at most MAX_BOARD_STATE_LENGTH chars", () => {
  assert.ok(STARTING_BOARD_COMPACT.length <= MAX_BOARD_STATE_LENGTH);
});

test("MAX_BOARD_STATE_LENGTH is 64", () => {
  assert.equal(MAX_BOARD_STATE_LENGTH, 64);
});

// ─── fenToCompact ─────────────────────────────────────────────────────────────

test("fenToCompact extracts piece-placement from full FEN", () => {
  assert.equal(fenToCompact(STARTING_FEN), STARTING_BOARD_COMPACT);
});

test("fenToCompact works for a mid-game FEN", () => {
  const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
  assert.equal(fenToCompact(fen), "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR");
});

test("fenToCompact strips side-to-move field", () => {
  const compact = fenToCompact(STARTING_FEN);
  assert.ok(!compact.includes(" "));
});

test("fenToCompact strips castling field", () => {
  const compact = fenToCompact(STARTING_FEN);
  assert.ok(!compact.includes("KQkq"));
});

test("fenToCompact strips en-passant field", () => {
  const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
  const compact = fenToCompact(fen);
  assert.ok(!compact.includes("e6"));
});

test("fenToCompact strips move counters", () => {
  const compact = fenToCompact(STARTING_FEN);
  assert.ok(!/\d+ \d+$/.test(compact));
});

test("fenToCompact result fits within 64 chars for starting position", () => {
  assert.ok(fenToCompact(STARTING_FEN).length <= 64);
});

test("fenToCompact result fits within 64 chars for typical mid-game", () => {
  const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
  assert.ok(fenToCompact(fen).length <= 64);
});

test("fenToCompact throws when piece-placement exceeds 64 chars", () => {
  // Construct an artificially long placement string
  const longPlacement = "r".repeat(65);
  assert.throws(() => fenToCompact(`${longPlacement} w - - 0 1`), /too long/);
});

test("fenToCompact handles FEN with no metadata (already compact)", () => {
  assert.equal(fenToCompact(STARTING_BOARD_COMPACT), STARTING_BOARD_COMPACT);
});

// ─── compactToFen ─────────────────────────────────────────────────────────────

test("compactToFen reconstructs a valid FEN from compact + turn", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w");
  assert.ok(fen.startsWith(STARTING_BOARD_COMPACT));
  assert.ok(fen.includes(" w "));
});

test("compactToFen includes side-to-move w", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w");
  assert.equal(fen.split(" ")[1], "w");
});

test("compactToFen includes side-to-move b", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "b");
  assert.equal(fen.split(" ")[1], "b");
});

test("compactToFen defaults castling to dash", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w");
  assert.equal(fen.split(" ")[2], "-");
});

test("compactToFen defaults en-passant to dash", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w");
  assert.equal(fen.split(" ")[3], "-");
});

test("compactToFen defaults half-move clock to 0", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w");
  assert.equal(fen.split(" ")[4], "0");
});

test("compactToFen defaults full-move number to 1", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w");
  assert.equal(fen.split(" ")[5], "1");
});

test("compactToFen accepts custom castling rights", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "w", "KQkq");
  assert.equal(fen.split(" ")[2], "KQkq");
});

test("compactToFen accepts custom en-passant square", () => {
  const fen = compactToFen(STARTING_BOARD_COMPACT, "b", "-", "e6");
  assert.equal(fen.split(" ")[3], "e6");
});

test("compactToFen round-trips with fenToCompact", () => {
  const original = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
  const fen = compactToFen(original, "w");
  assert.equal(fenToCompact(fen), original);
});

// ─── isValidCompactBoardState ─────────────────────────────────────────────────

test("isValidCompactBoardState accepts starting position", () => {
  assert.equal(isValidCompactBoardState(STARTING_BOARD_COMPACT), true);
});

test("isValidCompactBoardState accepts typical mid-game position", () => {
  assert.equal(
    isValidCompactBoardState("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR"),
    true
  );
});

test("isValidCompactBoardState rejects empty string", () => {
  assert.equal(isValidCompactBoardState(""), false);
});

test("isValidCompactBoardState rejects string longer than 64 chars", () => {
  assert.equal(isValidCompactBoardState("r".repeat(65)), false);
});

test("isValidCompactBoardState rejects full FEN with spaces", () => {
  assert.equal(isValidCompactBoardState(STARTING_FEN), false);
});

test("isValidCompactBoardState rejects strings with invalid characters", () => {
  assert.equal(isValidCompactBoardState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN!"), false);
});

test("isValidCompactBoardState accepts all valid piece characters", () => {
  assert.equal(isValidCompactBoardState("rnbqkpRNBQKP/8/8/8/8/8/8/8"), true);
});

test("isValidCompactBoardState accepts digit run-length encoding", () => {
  assert.equal(isValidCompactBoardState("8/8/8/8/8/8/8/8"), true);
});

// ─── isStartingPosition (updated for compact format) ─────────────────────────

test("isStartingPosition accepts full FEN", () => {
  assert.equal(isStartingPosition(STARTING_FEN), true);
});

test("isStartingPosition accepts compact piece-placement", () => {
  assert.equal(isStartingPosition(STARTING_BOARD_COMPACT), true);
});

test("isStartingPosition accepts padded full FEN", () => {
  assert.equal(isStartingPosition(`  ${STARTING_FEN}  `), true);
});

test("isStartingPosition rejects mid-game position", () => {
  assert.equal(
    isStartingPosition("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR"),
    false
  );
});

// ─── turnMatchesBoard (compact format) ────────────────────────────────────────

test("turnMatchesBoard returns true for compact board (no FEN side-to-move)", () => {
  const game: Game = {
    playerW: "SP_W",
    playerB: "SP_B",
    wager: 0,
    isStx: true,
    boardState: STARTING_BOARD_COMPACT,
    turn: "w",
    status: 1,
  };
  // Compact format has no side-to-move — always returns true
  assert.equal(turnMatchesBoard(game), true);
});

test("turnMatchesBoard returns true for compact board regardless of turn value", () => {
  const game: Game = {
    playerW: "SP_W",
    playerB: "SP_B",
    wager: 0,
    isStx: true,
    boardState: STARTING_BOARD_COMPACT,
    turn: "b",
    status: 1,
  };
  assert.equal(turnMatchesBoard(game), true);
});

test("turnMatchesBoard still works for full FEN board state", () => {
  const game: Game = {
    playerW: "SP_W",
    playerB: "SP_B",
    wager: 0,
    isStx: true,
    boardState: STARTING_FEN,
    turn: "w",
    status: 1,
  };
  assert.equal(turnMatchesBoard(game), true);
  assert.equal(turnMatchesBoard({ ...game, turn: "b" }), false);
});

// ─── Gas reduction measurement ────────────────────────────────────────────────

test("compact board-state is shorter than full FEN (gas reduction)", () => {
  const compact = fenToCompact(STARTING_FEN);
  assert.ok(compact.length < STARTING_FEN.length,
    `compact (${compact.length}) should be shorter than full FEN (${STARTING_FEN.length})`);
});

test("compact board-state byte savings >= 20% vs full FEN", () => {
  const compact = fenToCompact(STARTING_FEN);
  const savings = (STARTING_FEN.length - compact.length) / STARTING_FEN.length;
  assert.ok(savings >= 0.20,
    `Expected >= 20% savings, got ${(savings * 100).toFixed(1)}%`);
});

test("compact board-state fits in 64-byte field for all standard openings", () => {
  const openings = [
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",       // e4
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR",       // d4
    "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR",       // c4
    "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R",       // Nf3
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR",     // e4 e5
    "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R", // Italian
  ];
  for (const board of openings) {
    assert.ok(board.length <= 64, `Opening position too long: ${board.length} chars`);
    assert.equal(isValidCompactBoardState(board), true);
  }
});
