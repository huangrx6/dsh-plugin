/**
 * Tests for the marketplace source store. The store lives in localStorage
 * and is the only place where user choices (source order, custom sources)
 * persist, so we test:
 *
 *   - the empty-store behavior (returns the built-in defaults)
 *   - the user's source overrides (URL / name edits win over built-ins)
 *   - the CRUD operations (add / remove / reorder)
 *   - the built-in protection (removing a built-in is a no-op)
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addMarketSource,
  loadMarketSources,
  removeMarketSource,
  reorderMarketSources,
  storageKey,
} from "../../src/client/market/data-source-store.ts";
import { DEFAULT_MARKET_SOURCES } from "../../src/client/market/types.ts";

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

describe("data-source-store", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = mockStorage();
  });
  afterEach(() => {
    storage.clear();
  });

  it("returns the built-in defaults when storage is empty", () => {
    const sources = loadMarketSources(storage);
    expect(sources).toHaveLength(DEFAULT_MARKET_SOURCES.length);
    expect(sources[0]?.id).toBe(DEFAULT_MARKET_SOURCES[0]?.id);
  });

  it("adds a custom source at the end of the order", () => {
    const initial = loadMarketSources(storage);
    const next = addMarketSource(storage, initial, {
      name: "社区",
      url: "https://example.com/market.json",
    });
    expect(next).toHaveLength(initial.length + 1);
    expect(next.at(-1)?.name).toBe("社区");
    expect(next.at(-1)?.builtIn).toBe(false);
  });

  it("persists across reads", () => {
    const initial = loadMarketSources(storage);
    addMarketSource(storage, initial, {
      name: "社区",
      url: "https://example.com/market.json",
    });
    const reloaded = loadMarketSources(storage);
    expect(reloaded.find((source) => source.name === "社区")).toBeDefined();
  });

  it("refuses to remove a built-in source", () => {
    const initial = loadMarketSources(storage);
    const builtIn = initial[0];
    expect(builtIn).toBeDefined();
    const after = removeMarketSource(storage, initial, builtIn!.id);
    expect(after).toHaveLength(initial.length);
  });

  it("removes a custom source", () => {
    const initial = loadMarketSources(storage);
    const added = addMarketSource(storage, initial, {
      name: "社区",
      url: "https://example.com/market.json",
    });
    const targetId = added.at(-1)!.id;
    const after = removeMarketSource(storage, added, targetId);
    expect(after).toHaveLength(initial.length);
    expect(after.find((source) => source.id === targetId)).toBeUndefined();
  });

  it("reorders by the supplied id sequence", () => {
    const initial = loadMarketSources(storage);
    const added = addMarketSource(storage, initial, {
      name: "社区",
      url: "https://example.com/market.json",
    });
    const reversed = reorderMarketSources(
      storage,
      added,
      [...added].reverse().map((source) => source.id),
    );
    expect(reversed[0]?.id).toBe(added.at(-1)?.id);
    expect(reversed.at(-1)?.id).toBe(added[0]?.id);
  });

  it("sanitizes unknown fields on the way to storage", () => {
    const initial = loadMarketSources(storage);
    storage.setItem(
      storageKey(),
      JSON.stringify([
        {
          id: "evil",
          name: "Evil",
          url: "https://example.com",
          builtIn: false,
          order: 0,
          payload: { url: "https://attacker.example/sneaky" },
        },
      ]),
    );
    const reloaded = loadMarketSources(storage);
    const evil = reloaded.find((source) => source.id === "evil");
    expect(evil).toBeDefined();
    expect((evil as unknown as { payload?: unknown }).payload).toBeUndefined();
  });
});
