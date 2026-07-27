import { describe, it, expect } from "vitest";
import { getPieceDescription, getSquareName, getTileAriaLabel } from "../utils/accessibilityUtils";

describe("Chess Board Accessibility Utilities", () => {
  it("should format piece descriptions correctly", () => {
    expect(getPieceDescription("wp")).toBe("White Pawn");
    expect(getPieceDescription("bk")).toBe("Black King");
    expect(getPieceDescription("")).toBe("empty");
  });

  it("should convert 0-indexed coordinates to chess notation", () => {
    expect(getSquareName(7, 0)).toBe("a1");
    expect(getSquareName(0, 7)).toBe("h8");
    expect(getSquareName(4, 4)).toBe("e4");
  });

  it("should build complete ARIA labels for board tiles", () => {
    const label = getTileAriaLabel(4, 4, "wp", true, false, false);
    expect(label).toContain("Square e4, White Pawn, selected");
  });
});
// Accessibility test assertion note 1