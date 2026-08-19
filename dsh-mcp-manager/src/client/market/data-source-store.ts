/**
 * Source persistence. A marketplace source is a (name, url, order, builtIn)
 * record that lives in localStorage under a per-plugin key. The launcher
 * seeds the storage with the package's built-in list on first read; every
 * subsequent read returns the merged list.
 *
 * The store is intentionally sync — sources are tiny and reads happen at
 * React render time. Persistence writes are debounced via the React commit
 * cycle, so we don't need to batch here.
 */
import { DEFAULT_MARKET_SOURCES, type MarketSource } from "./types.ts";

const STORAGE_KEY = "dsh-launcher.market.sources.v1";

/** Storage slot the launcher owns. Public so other plugins can read it. */
export function storageKey(): string {
  return STORAGE_KEY;
}

function readRaw(storage: Storage): MarketSource[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: MarketSource[] = [];
    for (const value of parsed) {
      if (value === null || typeof value !== "object" || Array.isArray(value))
        continue;
      const record = value as Record<string, unknown>;
      if (typeof record["id"] !== "string") continue;
      if (typeof record["name"] !== "string") continue;
      if (typeof record["url"] !== "string") continue;
      const builtIn = record["builtIn"] === true;
      const order = typeof record["order"] === "number" ? record["order"] : 0;
      const tag = typeof record["tag"] === "string" ? record["tag"] : undefined;
      out.push({
        id: record["id"],
        name: record["name"],
        url: record["url"],
        builtIn,
        order,
        ...(tag === undefined ? {} : { tag }),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function writeRaw(storage: Storage, sources: readonly MarketSource[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(sources.map(sanitize)));
}

/** Strip user-supplied fields we don't trust (e.g. `payload`). */
function sanitize(source: MarketSource): MarketSource {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    builtIn: source.builtIn,
    order: source.order,
    ...(source.tag === undefined ? {} : { tag: source.tag }),
  };
}

export function loadMarketSources(storage: Storage): MarketSource[] {
  const user = readRaw(storage);
  const userIds = new Set(user.map((source) => source.id));
  // The built-in sources always appear; if the user has stored a copy
  // under the same id, the user's updated url / name wins. Stored records
  // flagged builtIn that are no longer in the default list are retired
  // built-ins (the removed "DSH 内置" feed) — they drop out here so the
  // shelf stops rendering them once the package retires them.
  const retiredBuiltIn = new Set(
    user
      .filter((source) => source.builtIn)
      .map((source) => source.id)
      .filter((id) => !DEFAULT_MARKET_SOURCES.some((builtIn) => builtIn.id === id)),
  );
  const merged: MarketSource[] = [];
  for (const builtIn of DEFAULT_MARKET_SOURCES) {
    const override = user.find((source) => source.id === builtIn.id);
    merged.push(override ?? builtIn);
  }
  for (const source of user) {
    if (!userIds.has(source.id)) continue;
    if (retiredBuiltIn.has(source.id)) continue;
    if (merged.some((existing) => existing.id === source.id)) continue;
    merged.push(source);
  }
  merged.sort((a, b) => a.order - b.order);
  return merged;
}

export function saveMarketSources(
  storage: Storage,
  sources: readonly MarketSource[],
): void {
  writeRaw(storage, sources);
}

export function addMarketSource(
  storage: Storage,
  sources: readonly MarketSource[],
  candidate: { name: string; url: string },
): MarketSource[] {
  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const order =
    sources.reduce((max, source) => Math.max(max, source.order), -1) + 1;
  const next = [
    ...sources,
    { id, name: candidate.name, url: candidate.url, builtIn: false, order },
  ];
  saveMarketSources(storage, next);
  return next;
}

export function removeMarketSource(
  storage: Storage,
  sources: readonly MarketSource[],
  id: string,
): MarketSource[] {
  const next = sources.filter((source) => source.id !== id || source.builtIn);
  saveMarketSources(storage, next);
  return next;
}

/**
 * Rename / re-point an existing source. Keeps id, builtIn flag, order and
 * tag; the stored copy wins over the built-in defaults on the next load,
 * so editing works for every source (including overriding a built-in URL).
 */
export function updateMarketSource(
  storage: Storage,
  sources: readonly MarketSource[],
  id: string,
  patch: { name: string; url: string },
): MarketSource[] {
  const next = sources.map((source) =>
    source.id === id
      ? { ...source, name: patch.name, url: patch.url }
      : source,
  );
  saveMarketSources(storage, next);
  return next;
}

export function reorderMarketSources(
  storage: Storage,
  sources: readonly MarketSource[],
  orderedIds: readonly string[],
): MarketSource[] {
  const lookup = new Map(sources.map((source) => [source.id, source] as const));
  const next: MarketSource[] = [];
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    if (id === undefined) continue;
    const source = lookup.get(id);
    if (source === undefined) continue;
    next.push({ ...source, order: index });
  }
  // Append any source the user didn't reorder (e.g. brand-new sources).
  for (const source of sources) {
    if (next.some((existing) => existing.id === source.id)) continue;
    next.push({ ...source, order: next.length });
  }
  saveMarketSources(storage, next);
  return next;
}
