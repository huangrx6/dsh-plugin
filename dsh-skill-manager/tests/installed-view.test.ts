/**
 * Tests for the installed-catalog view preference (list ⇄ cards). Same
 * single-slot record shape as the market's, but under its own storage key
 * so the two tabs stay independent; anything unreadable or unknown falls
 * back to the compact row list, and failed writes stay silent.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  installedViewStorageKey,
  loadInstalledView,
  saveInstalledView,
} from "../src/client/installed-view.ts";

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

describe("installed-view", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = mockStorage();
  });
  afterEach(() => {
    storage.clear();
  });

  it("defaults to the row list", () => {
    expect(loadInstalledView(storage)).toBe("list");
  });

  it("round-trips the cards preference", () => {
    saveInstalledView(storage, "cards");
    expect(loadInstalledView(storage)).toBe("cards");
    expect(storage.getItem(installedViewStorageKey())).toBe("cards");
  });

  it("round-trips an explicit list preference", () => {
    saveInstalledView(storage, "cards");
    saveInstalledView(storage, "list");
    expect(loadInstalledView(storage)).toBe("list");
  });

  it("falls back to list for unknown stored values", () => {
    storage.setItem(installedViewStorageKey(), "mosaic");
    expect(loadInstalledView(storage)).toBe("list");
  });

  it("does not share the market view slot", () => {
    expect(installedViewStorageKey()).not.toBe(
      "dsh-skill-manager.market.view.v1",
    );
    saveInstalledView(storage, "cards");
    expect(storage.getItem("dsh-skill-manager.market.view.v1")).toBeNull();
  });
});
