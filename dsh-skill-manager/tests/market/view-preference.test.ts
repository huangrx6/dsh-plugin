/**
 * Tests for the market view preference (list ⇄ cards). The record is a
 * single localStorage slot; anything unreadable or unknown falls back to
 * the compact row list, and failed writes stay silent.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadMarketView,
  marketViewStorageKey,
  saveMarketView,
} from "../../src/client/market/view-preference.ts";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    clear(): void {
      map.clear();
    },
    getItem(key: string): string | null {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    key(index: number): string | null {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
  } as unknown as Storage;
}

describe("view-preference", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = mockStorage();
  });
  afterEach(() => {
    storage.clear();
  });

  it("defaults to the row list", () => {
    expect(loadMarketView(storage)).toBe("list");
  });

  it("round-trips the cards preference", () => {
    saveMarketView(storage, "cards");
    expect(loadMarketView(storage)).toBe("cards");
    expect(storage.getItem(marketViewStorageKey())).toBe("cards");
  });

  it("round-trips an explicit list preference", () => {
    saveMarketView(storage, "cards");
    saveMarketView(storage, "list");
    expect(loadMarketView(storage)).toBe("list");
  });

  it("falls back to list for unknown stored values", () => {
    storage.setItem(marketViewStorageKey(), "mosaic");
    expect(loadMarketView(storage)).toBe("list");
  });
});
