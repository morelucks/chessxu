import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GAME_STATUS,
  STATUS_NAMES,
  isValidGameStatus,
  getStatusName,
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
