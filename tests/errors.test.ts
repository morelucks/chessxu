import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ERRORS,
  ERROR_NAMES,
  ERROR_MESSAGES,
  getErrorName,
  getErrorMessage,
  isKnownError,
} from "../src/index";

test("ERROR_NAMES is a complete reverse map of ERRORS", () => {
  for (const [name, code] of Object.entries(ERRORS)) {
    assert.equal(ERROR_NAMES[code], name);
  }
});

test("getErrorName resolves known codes and rejects unknown ones", () => {
  assert.equal(getErrorName(ERRORS.ERR_NOT_OWNER), "ERR_NOT_OWNER");
  assert.equal(getErrorName(ERRORS.ERR_INVALID_STATUS), "ERR_INVALID_STATUS");
  assert.equal(getErrorName(9999), undefined);
});

test("isKnownError distinguishes contract errors from arbitrary numbers", () => {
  assert.equal(isKnownError(ERRORS.ERR_NOT_YOUR_TURN), true);
  assert.equal(isKnownError(0), false);
  assert.equal(isKnownError(9999), false);
});

test("every error code has a human-readable message", () => {
  for (const code of Object.values(ERRORS)) {
    assert.equal(typeof ERROR_MESSAGES[code], "string");
    assert.ok(ERROR_MESSAGES[code].length > 0);
  }
});

test("getErrorMessage falls back and surfaces the raw code", () => {
  assert.equal(getErrorMessage(ERRORS.ERR_INVALID_WAGER), "Wager amount is invalid");
  assert.match(getErrorMessage(9999), /9999/);
});
