import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GAME_STATUS,
  STATUS_NAMES,
  isValidGameStatus,
  getStatusName,
  isAwaitingOpponent,
  isGameActive,
  isGameOver,
  getWinner,
  gameResultText,
} from "../src/index";

test("STATUS_NAMES is a complete reverse map of GAME_STATUS", () => {
  for (const [name, code] of Object.entries(GAME_STATUS)) {
    assert.equal(STATUS_NAMES[code], name);
  }
});

test("isValidGameStatus accepts defined statuses and rejects others", () => {
  assert.equal(isValidGameStatus(GAME_STATUS.WAITING), true);
  assert.equal(isValidGameStatus(GAME_STATUS.CANCELLED), true);
  assert.equal(isValidGameStatus(99), false);
});

test("getStatusName resolves codes to names", () => {
  assert.equal(getStatusName(GAME_STATUS.DRAW), "DRAW");
  assert.equal(getStatusName(99), undefined);
});

test("status predicates are mutually consistent across all statuses", () => {
  const partition = (s: number) =>
    [isAwaitingOpponent(s), isGameActive(s), isGameOver(s)].filter(Boolean).length;
  for (const code of Object.values(GAME_STATUS)) {
    // Every defined status belongs to exactly one lifecycle phase.
    assert.equal(partition(code), 1, `status ${code} matched multiple phases`);
  }
});

test("isGameOver is true for wins, draw and cancellation only", () => {
  assert.equal(isGameOver(GAME_STATUS.WHITE_WINS), true);
  assert.equal(isGameOver(GAME_STATUS.BLACK_WINS), true);
  assert.equal(isGameOver(GAME_STATUS.DRAW), true);
  assert.equal(isGameOver(GAME_STATUS.CANCELLED), true);
  assert.equal(isGameOver(GAME_STATUS.WAITING), false);
  assert.equal(isGameOver(GAME_STATUS.ONGOING), false);
});

test("getWinner reports decisive results, draws and non-results", () => {
  assert.equal(getWinner(GAME_STATUS.WHITE_WINS), "white");
  assert.equal(getWinner(GAME_STATUS.BLACK_WINS), "black");
  assert.equal(getWinner(GAME_STATUS.DRAW), "draw");
  assert.equal(getWinner(GAME_STATUS.ONGOING), null);
  assert.equal(getWinner(GAME_STATUS.CANCELLED), null);
});

test("gameResultText produces a label for every defined status", () => {
  for (const code of Object.values(GAME_STATUS)) {
    assert.doesNotMatch(gameResultText(code), /^Unknown/);
  }
  assert.match(gameResultText(99), /^Unknown/);
});
