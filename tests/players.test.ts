import { test } from "node:test";
import assert from "node:assert/strict";
import { opponentOf, colorOf, isPlayer, Game } from "../src/index";

const game: Game = {
  playerW: "SP_WHITE",
  playerB: "SP_BLACK",
  wager: 1000,
  isStx: true,
  boardState: "",
  turn: "w",
  status: 1,
};

test("opponentOf flips the colour", () => {
  assert.equal(opponentOf("w"), "b");
  assert.equal(opponentOf("b"), "w");
});

test("opponentOf is its own inverse", () => {
  assert.equal(opponentOf(opponentOf("w")), "w");
  assert.equal(opponentOf(opponentOf("b")), "b");
});

test("colorOf maps each player address to its colour", () => {
  assert.equal(colorOf(game, "SP_WHITE"), "w");
  assert.equal(colorOf(game, "SP_BLACK"), "b");
  assert.equal(colorOf(game, "SP_STRANGER"), null);
});

test("isPlayer recognises participants only", () => {
  assert.equal(isPlayer(game, "SP_WHITE"), true);
  assert.equal(isPlayer(game, "SP_BLACK"), true);
  assert.equal(isPlayer(game, "SP_STRANGER"), false);
});
