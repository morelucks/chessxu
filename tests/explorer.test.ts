import { test } from "node:test";
import assert from "node:assert/strict";
import {
  txExplorerUrl,
  addressExplorerUrl,
  CHESSXU_DEPLOYER,
} from "../src/index";

test("txExplorerUrl normalises the 0x prefix", () => {
  const withPrefix = txExplorerUrl("0xabc123");
  const withoutPrefix = txExplorerUrl("abc123");
  assert.equal(withPrefix, withoutPrefix);
  assert.match(withPrefix, /\/txid\/0xabc123\?chain=mainnet$/);
});

test("addressExplorerUrl points at the address route", () => {
  assert.equal(
    addressExplorerUrl(CHESSXU_DEPLOYER),
    `https://explorer.hiro.so/address/${CHESSXU_DEPLOYER}?chain=mainnet`
  );
});
