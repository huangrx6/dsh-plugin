/**
 * Source persistence. A marketplace source is a (name, url, order, builtIn)
 * record that lives in localStorage under a per-plugin key. The launcher
 * seeds the storage with the package's built-in list on first read; every
 * subsequent read returns the merged list.
 *
 * The store is intentionally sync — sources are tiny and reads happen at
 * React render time. Persistence writes are debounced via the React commit
 * cycle, so we don't need to batch here.
 *
 * Every mutation is a read-modify-write: it re-reads the persisted list and
 * unions it with the caller's in-memory list before saving, so a stale or
 * empty `sources` argument (a second shelf instance, a load that fell back
 * to defaults) can never overwrite sources another instance already saved.
 * Reads and writes are additionally guarded: a quarantined / quota-exhausted
 * storage degrades to "nothing stored" / "best-effort write" instead of
 * throwing into React render or a click handler.
 */
import { DEFAULT_MARKET_SOURCES, type MarketSource } from "./types.ts";

// Own storage slot — skill and MCP markets keep SEPARATE source
// lists (they shared the launcher-era key once, which leaked skill
// sources into the MCP market and back).
const STORAGE_KEY = "dsh-mcp-manager.market.sources.v1";

/** Storage slot the launcher owns. Public so other plugins can read it. */
export function storageKey(): string {
  return STORAGE_KEY;
}

function readRaw(storage: Storage): MarketSource[] {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    // Storage itself unavailable (quarantined webview, privacy mode) —
    // report "nothing stored" instead of throwing into React render.
    return [];
  }
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
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sources.map(sanitize)));
  } catch {
    // Best-effort persistence (quota exceeded, storage quarantined): the
    // caller's in-memory list still updates; a failed write must never
    // crash the click handler that triggered it. Same policy as
    // preferences.ts.
  }
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
    if (retiredBuiltIn.has(source.id)) continue;
    if (merged.some((existing) => existing.id === source.id)) continue;
    merged.push(source);
  }
  merged.sort((a, b) => a.order - b.order);
  return merged;
}

/**
 * Read-modify-write base for every mutation: the persisted list unioned
 * with the caller's in-memory list (on id collisions the caller's fresher
 * copy wins). Mutations derive their `next` from this, so a stale or empty
 * `sources` argument can never overwrite sources another shelf instance
 * already saved under the same key.
 */
function mergeWithStored(
  storage: Storage,
  sources: readonly MarketSource[],
): MarketSource[] {
  const merged = [...sources];
  for (const entry of loadMarketSources(storage)) {
    if (merged.some((existing) => existing.id === entry.id)) continue;
    merged.push(entry);
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
  const base = mergeWithStored(storage, sources);
  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const order =
    base.reduce((max, source) => Math.max(max, source.order), -1) + 1;
  const next = [
    ...base,
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
  const next = mergeWithStored(storage, sources).filter(
    (source) => source.id !== id || source.builtIn,
  );
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
  const next = mergeWithStored(storage, sources).map((source) =>
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
  const base = mergeWithStored(storage, sources);
  const lookup = new Map(base.map((source) => [source.id, source] as const));
  const next: MarketSource[] = [];
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    if (id === undefined) continue;
    const source = lookup.get(id);
    if (source === undefined) continue;
    next.push({ ...source, order: index });
  }
  // Append any source the user didn't reorder (e.g. brand-new sources).
  for (const source of base) {
    if (next.some((existing) => existing.id === source.id)) continue;
    next.push({ ...source, order: next.length });
  }
  saveMarketSources(storage, next);
  return next;
}
