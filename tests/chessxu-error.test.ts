import { test } from "node:test";
import assert from "node:assert/strict";
import { ChessxuError, ERRORS } from "../src/index";

test("ChessxuError carries code, name and message for known codes", () => {
  const err = new ChessxuError(ERRORS.ERR_NOT_YOUR_TURN);
  assert.ok(err instanceof Error);
  assert.equal(err.code, ERRORS.ERR_NOT_YOUR_TURN);
  assert.equal(err.name, "ERR_NOT_YOUR_TURN");
  assert.equal(err.message, "It is not the caller's turn to move");
});

test("ChessxuError degrades gracefully for unknown codes", () => {
  const err = new ChessxuError(9999);
  assert.equal(err.name, "ChessxuError");
  assert.match(err.message, /9999/);
});

test("ChessxuError.fromClarity parses error responses", () => {
  const err = ChessxuError.fromClarity("(err u102)");
  assert.ok(err);
  assert.equal(err?.code, 102);
  assert.equal(ChessxuError.fromClarity("(ok true)"), null);
});
