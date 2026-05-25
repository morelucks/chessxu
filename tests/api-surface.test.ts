import { test } from "node:test";
import assert from "node:assert/strict";
import * as sdk from "../src/index";

// Guards against accidental removal or rename of public exports. Keep this list
// in sync with docs/SDK.md and CHANGELOG.md.
const EXPECTED_EXPORTS = [
  // constants
  "CHESSXU_DEPLOYER",
  "CONTRACTS",
  "ERRORS",
  "GAME_STATUS",
  "ERROR_NAMES",
  "ERROR_MESSAGES",
  "STATUS_NAMES",
  "CHESS_DECIMALS",
  "ONE_CHESS",
  "STARTING_FEN",
  "EXPLORER_BASE_URL",
  // contract id helpers
  "parseContractId",
  "getContractAddress",
  "getContractName",
  // error helpers
  "getErrorName",
  "getErrorMessage",
  "isKnownError",
  "describeError",
  "parseClarityErrorCode",
  "ChessxuError",
  // status helpers
  "getStatusName",
  "isValidGameStatus",
  "isAwaitingOpponent",
  "isGameActive",
  "isGameOver",
  "getWinner",
  "gameResultText",
  // player helpers
  "opponentOf",
  "colorOf",
  "isPlayer",
  "isPlayersTurn",
  // validation
  "isValidStacksAddress",
  "isMainnetAddress",
  "isTestnetAddress",
  "isValidWager",
  "assertValidWager",
  // token helpers
  "formatChess",
  "parseChess",
  // board helpers
  "isStartingPosition",
  "activeColorFromFen",
  "turnMatchesBoard",
  // explorer helpers
  "txExplorerUrl",
  "addressExplorerUrl",
  "contractExplorerUrl",
] as const;

test("all documented exports are present", () => {
  for (const name of EXPECTED_EXPORTS) {
    assert.ok(name in sdk, `missing export: ${name}`);
  }
});

test("no documented function export is undefined", () => {
  for (const name of EXPECTED_EXPORTS) {
    assert.notEqual((sdk as Record<string, unknown>)[name], undefined);
  }
});
