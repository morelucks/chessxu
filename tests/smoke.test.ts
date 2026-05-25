import { test } from "node:test";
import assert from "node:assert/strict";
import { CHESSXU_DEPLOYER, CONTRACTS } from "../src/index";

test("deployer address is exported", () => {
  assert.equal(typeof CHESSXU_DEPLOYER, "string");
  assert.ok(CHESSXU_DEPLOYER.length > 0);
});

test("contract identifiers are namespaced under the deployer", () => {
  for (const id of Object.values(CONTRACTS)) {
    assert.ok(id.startsWith(`${CHESSXU_DEPLOYER}.`));
  }
});
