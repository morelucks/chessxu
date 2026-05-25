import { test } from "node:test";
import assert from "node:assert/strict";
import { CHESS_DECIMALS, ONE_CHESS, formatChess, parseChess } from "../src/index";

test("token constants reflect 6-decimal CHESS", () => {
  assert.equal(CHESS_DECIMALS, 6);
  assert.equal(ONE_CHESS, 1_000_000);
});

test("formatChess renders whole and fractional amounts", () => {
  assert.equal(formatChess(0), "0");
  assert.equal(formatChess(ONE_CHESS), "1");
  assert.equal(formatChess(1_500_000), "1.5");
  assert.equal(formatChess(1), "0.000001");
  assert.equal(formatChess(-2_500_000), "-2.5");
});

test("formatChess rejects non-integer base units", () => {
  assert.throws(() => formatChess(1.5));
});

test("parseChess converts decimal strings to base units", () => {
  assert.equal(parseChess("1"), ONE_CHESS);
  assert.equal(parseChess("1.5"), 1_500_000);
  assert.equal(parseChess("0.000001"), 1);
  assert.equal(parseChess("-2.5"), -2_500_000);
});

test("parseChess rejects malformed and over-precise input", () => {
  assert.throws(() => parseChess("abc"));
  assert.throws(() => parseChess(""));
  assert.throws(() => parseChess("1.0000001"));
});

test("formatChess and parseChess round-trip", () => {
  for (const n of [0, 1, 999_999, 1_000_000, 123_456_789]) {
    assert.equal(parseChess(formatChess(n)), n);
  }
});
