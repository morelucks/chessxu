import { describe, it, expect } from "vitest";
import { captureException, captureMessage, addBreadcrumb } from "../sentryLogger";

describe("Sentry Logger Utilities", () => {
  it("should capture exception without crashing", () => {
    const err = new Error("Test Error");
    expect(() => captureException(err)).not.toThrow();
  });

  it("should capture message without crashing", () => {
    expect(() => captureMessage("Test Message")).not.toThrow();
  });

  it("should add breadcrumb cleanly", () => {
    expect(() => addBreadcrumb({ category: "test", message: "breadcrumb message" })).not.toThrow();
  });
});