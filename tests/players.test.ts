import { test } from "node:test";
import assert from "node:assert/strict";
import { opponentOf } from "../src/index";

test("opponentOf flips the colour", () => {
  assert.equal(opponentOf("w"), "b");
  assert.equal(opponentOf("b"), "w");
});

test("opponentOf is its own inverse", () => {
  assert.equal(opponentOf(opponentOf("w")), "w");
  assert.equal(opponentOf(opponentOf("b")), "b");
});
