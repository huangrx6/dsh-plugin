/**
 * Tests for the marketplace source store. The store lives in localStorage
 * and is the only place where user choices (source order, custom sources)
 * persist, so we test:
 *
 *   - the empty-store behavior (no defaults — the "DSH 内置" feed retired)
 *   - the retired-built-in purge (stored builtIns no longer shipped drop out)
 *   - the CRUD operations (add / edit / remove / reorder)
 *   - the built-in protection (removing a built-in is a no-op)
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addMarketSource,
  loadMarketSources,
  removeMarketSource,
  reorderMarketSources,
  saveMarketSources,
  storageKey,
  updateMarketSource,
} from "../../src/client/market/data-source-store.ts";
import { DEFAULT_MARKET_SOURCES, type MarketSource } from "../../src/client/market/types.ts";

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

  it("starts empty when storage is empty (the built-in feed was retired)", () => {
    const sources = loadMarketSources(storage);
    expect(DEFAULT_MARKET_SOURCES).toHaveLength(0);
    expect(sources).toHaveLength(0);
  });

  it("drops stored built-in sources the package no longer ships", () => {
    storage.setItem(
      storageKey(),
      JSON.stringify([
        {
          id: "dsh-launcher-builtin",
          name: "DSH 内置",
          url: "https://example.com/builtin.json",
          builtIn: true,
          order: 0,
        },
      ]),
    );
    const sources = loadMarketSources(storage);
    expect(sources.find((source) => source.id === "dsh-launcher-builtin")).toBeUndefined();
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
    const builtIn: MarketSource = {
      id: "seed-builtin",
      name: "Seed",
      url: "https://example.com/seed.json",
      builtIn: true,
      order: 0,
    };
    const after = removeMarketSource(storage, [builtIn], builtIn.id);
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe(builtIn.id);
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

  it("edits a source in place, keeping id / order / builtIn", () => {
    const initial = loadMarketSources(storage);
    const added = addMarketSource(storage, initial, {
      name: "社区",
      url: "https://example.com/market.json",
    });
    const target = added.at(-1)!;
    const next = updateMarketSource(storage, added, target.id, {
      name: "社区镜像",
      url: "https://mirror.example.com/market.json",
    });
    expect(next).toHaveLength(added.length);
    const edited = next.find((source) => source.id === target.id);
    expect(edited?.name).toBe("社区镜像");
    expect(edited?.url).toBe("https://mirror.example.com/market.json");
    expect(edited?.order).toBe(target.order);
    expect(edited?.builtIn).toBe(false);
    // persisted: a fresh load sees the edit
    expect(loadMarketSources(storage).find((source) => source.id === target.id)?.name).toBe("社区镜像");
  });

  it("treats an edit without effective changes as a no-op", () => {
    const initial = loadMarketSources(storage);
    const added = addMarketSource(storage, initial, {
      name: "社区",
      url: "https://example.com/market.json",
    });
    const next = updateMarketSource(storage, added, added.at(-1)!.id, {
      name: "  ",
    });
    expect(next.at(-1)?.name).toBe("社区");
  });

  it("reorders by the supplied id sequence", () => {
    const initial = loadMarketSources(storage);
    const first = addMarketSource(storage, initial, {
      name: "一",
      url: "https://example.com/a.json",
    });
    const added = addMarketSource(storage, first, {
      name: "二",
      url: "https://example.com/b.json",
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

  it("round-trips a saved list verbatim (no phantom built-ins appear)", () => {
    const seeded: MarketSource[] = [
      { id: "s1", name: "One", url: "https://example.com/1.json", builtIn: false, order: 1 },
      { id: "s2", name: "Two", url: "https://example.com/2.json", builtIn: false, order: 0 },
    ];
    saveMarketSources(storage, seeded);
    const reloaded = loadMarketSources(storage);
    expect(reloaded.map((source) => source.id)).toEqual(["s2", "s1"]);
  });
});
