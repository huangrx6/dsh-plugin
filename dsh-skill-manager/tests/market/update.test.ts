/**
 * Tests for the market update comparison. The rule: both sides must carry
 * a version and they must differ — anything else renders as a plain
 * installed item (never a false "update available" nag).
 */
import { describe, expect, it } from "vitest";
import { isUpdateAvailable } from "../../src/client/market/update.ts";

describe("isUpdateAvailable", () => {
  it("flags differing versions", () => {
    expect(isUpdateAvailable("0.2.0", "0.1.0")).toBe(true);
  });

  it("ignores whitespace padding on either side", () => {
    expect(isUpdateAvailable(" 0.2.0 ", "0.1.0")).toBe(true);
    expect(isUpdateAvailable("0.1.0", " 0.1.0 ")).toBe(false);
  });

  it("treats equal versions as current", () => {
    expect(isUpdateAvailable("1.0.0", "1.0.0")).toBe(false);
  });

  it("treats a missing market version as unknown (no badge)", () => {
    expect(isUpdateAvailable(undefined, "1.0.0")).toBe(false);
  });

  it("treats a missing installed version as unknown (no badge)", () => {
    expect(isUpdateAvailable("2.0.0", undefined)).toBe(false);
  });

  it("treats both missing as unknown", () => {
    expect(isUpdateAvailable(undefined, undefined)).toBe(false);
  });
});
