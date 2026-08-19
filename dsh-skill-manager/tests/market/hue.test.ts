/**
 * Tests for the per-entry identity hue. The contract: djb2 (seed 5381,
 * hash × 33 + code) reduced mod 360 — stable for a given name, always a
 * whole degree in [0, 360), and distinct enough across a shelf of
 * names to read as per-card identities.
 */
import { describe, expect, it } from "vitest";
import { hueFromName, hueStyle } from "../../src/client/market/hue.ts";

describe("hueFromName", () => {
  it("returns a whole hue in [0, 360)", () => {
    for (const name of ["pdf-export", "web-search", "csv", "a", ""]) {
      const hue = hueFromName(name);
      expect(Number.isInteger(hue)).toBe(true);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it("is stable for the same name", () => {
    expect(hueFromName("pdf-export")).toBe(hueFromName("pdf-export"));
  });

  it("hashes djb2 from the 5381 seed (empty string)", () => {
    expect(hueFromName("")).toBe(5381 % 360);
  });

  it("spreads distinct identities across sample names", () => {
    const hues = new Set(["pdf-export", "web-search", "code-review", "deploy"].map(hueFromName));
    expect(hues.size).toBeGreaterThan(1);
  });
});

describe("hueStyle", () => {
  it("publishes the hue as the --dshm-h custom property", () => {
    expect(hueStyle("csv")).toEqual({ "--dshm-h": String(hueFromName("csv")) });
  });
});
