import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidStacksAddress,
  isValidWager,
  assertValidWager,
  CHESSXU_DEPLOYER,
} from "../src/index";

test("the deployer address passes structural validation", () => {
  assert.equal(isValidStacksAddress(CHESSXU_DEPLOYER), true);
});

test("isValidStacksAddress rejects malformed input", () => {
  assert.equal(isValidStacksAddress(""), false);
  assert.equal(isValidStacksAddress("SP"), false);
  assert.equal(isValidStacksAddress("0x1234"), false);
  assert.equal(isValidStacksAddress(CHESSXU_DEPLOYER.toLowerCase()), false);
  // contains excluded Crockford characters (I, O)
  assert.equal(isValidStacksAddress("SPIOIOIOIOIOIOIOIOIOIOIOIOIOIOIOIOIOIOIO"), false);
});

test("isValidWager accepts positive integers only", () => {
  assert.equal(isValidWager(1), true);
  assert.equal(isValidWager(1_000_000), true);
  assert.equal(isValidWager(0), false);
  assert.equal(isValidWager(-5), false);
  assert.equal(isValidWager(1.5), false);
  assert.equal(isValidWager(NaN), false);
  assert.equal(isValidWager(Number.MAX_VALUE), false);
});

test("assertValidWager throws on invalid amounts and passes valid ones", () => {
  assert.doesNotThrow(() => assertValidWager(1000));
  assert.throws(() => assertValidWager(0), /Invalid wager/);
  assert.throws(() => assertValidWager(-1), /Invalid wager/);
});
