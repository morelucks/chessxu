import { test } from "node:test";
import assert from "node:assert/strict";
import { parseContractId } from "../src/index";

test("parseContractId splits address and name", () => {
  const { address, name } = parseContractId("SP000.my-contract");
  assert.equal(address, "SP000");
  assert.equal(name, "my-contract");
});

test("parseContractId keeps only the first dot as the separator", () => {
  // Stacks names never contain dots, but be explicit about the contract.
  const { address, name } = parseContractId("SP000.a.b");
  assert.equal(address, "SP000");
  assert.equal(name, "a.b");
});

test("parseContractId rejects identifiers without a name", () => {
  assert.throws(() => parseContractId("SP000"));
  assert.throws(() => parseContractId("SP000."));
  assert.throws(() => parseContractId(".name"));
});
