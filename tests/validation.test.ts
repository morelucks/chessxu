import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidStacksAddress, CHESSXU_DEPLOYER } from "../src/index";

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
