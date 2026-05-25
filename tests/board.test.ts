import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STARTING_FEN,
  isStartingPosition,
  activeColorFromFen,
  turnMatchesBoard,
  Game,
} from "../src/index";

test("isStartingPosition matches the standard opening, ignoring padding", () => {
  assert.equal(isStartingPosition(STARTING_FEN), true);
  assert.equal(isStartingPosition(`  ${STARTING_FEN}  `), true);
  assert.equal(isStartingPosition("8/8/8/8/8/8/8/8 w - - 0 1"), false);
});

test("activeColorFromFen reads the side-to-move field", () => {
  assert.equal(activeColorFromFen(STARTING_FEN), "w");
  assert.equal(
    activeColorFromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"),
    "b"
  );
  assert.equal(activeColorFromFen("just one field"), null);
});

test("turnMatchesBoard cross-checks game.turn against the FEN", () => {
  const base: Game = {
    playerW: "SP_W",
    playerB: "SP_B",
    wager: 1,
    isStx: true,
    boardState: STARTING_FEN,
    turn: "w",
    status: 1,
  };
  assert.equal(turnMatchesBoard(base), true);
  assert.equal(turnMatchesBoard({ ...base, turn: "b" }), false);
  assert.equal(turnMatchesBoard({ ...base, boardState: "garbage" }), false);
});
