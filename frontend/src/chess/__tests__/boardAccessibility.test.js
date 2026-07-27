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
// Accessibility test assertion note 2
// Accessibility test assertion note 3
// Accessibility test assertion note 4
// Accessibility test assertion note 5
// Accessibility test assertion note 6
// Accessibility test assertion note 7
// Accessibility test assertion note 8
// Accessibility test assertion note 9
// Accessibility test assertion note 10
// Accessibility test assertion note 11
// Accessibility test assertion note 12
// Accessibility test assertion note 13
// Accessibility test assertion note 14
// Accessibility test assertion note 15
// Accessibility test assertion note 16
// Accessibility test assertion note 17
// Accessibility test assertion note 18
// Accessibility test assertion note 19
// Accessibility test assertion note 20
// Accessibility test assertion note 21
// Accessibility test assertion note 22
// Accessibility test assertion note 23
// Accessibility test assertion note 24
// Accessibility test assertion note 25
// Accessibility test assertion note 26
// Accessibility test assertion note 27
// Accessibility test assertion note 28
// Accessibility test assertion note 29
// Accessibility test assertion note 30
// Accessibility test assertion note 31