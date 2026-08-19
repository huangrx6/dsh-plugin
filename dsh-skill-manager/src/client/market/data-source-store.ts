/**
 * Source persistence. A marketplace source is a (name, url, order, builtIn)
 * record that lives in localStorage under a per-plugin key. Reads merge the
 * stored list with the package's built-in list (currently empty — the
 * built-in feed was retired); every mutation persists the full merged list
 * back, so a fresh reader (page reload) sees exactly what the user left.
 *
 * The store is intentionally sync — sources are tiny and reads happen at
 * React render time. Storage failures never throw: reads degrade to the
 * empty list and writes degrade to session-only (see readRaw / writeRaw),
 * so a blocked localStorage can't break the add / edit / remove handlers
 * or make saved sources look lost.
 */
import { DEFAULT_MARKET_SOURCES, type MarketSource } from "./types.ts";

// Own storage slot — skill and MCP markets keep SEPARATE source
// lists (they shared the launcher-era key once, which leaked skill
// sources into the MCP market and back).
const STORAGE_KEY = "dsh-skill-manager.market.sources.v1";

/** Storage slot the launcher owns. Public so other plugins can read it. */
export function storageKey(): string {
  return STORAGE_KEY;
}

function readRaw(storage: Storage): MarketSource[] {
  try {
    // getItem itself can throw (storage disabled / private mode) — that
    // must degrade to "empty list", never propagate: a throwing read
    // would push the shelf onto its defaultSources fallback and make
    // every source look like it vanished.
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return [];
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
    // Storage unavailable (quota / private mode): the list stays
    // session-only, matching saveMarketView / saveMode semantics. Never
    // let a failed write break the add / edit / remove click handler.
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
  // built-ins (e.g. the removed "DSH 内置" feed) — they drop out here so
  // the shelf stops rendering them once the package retires them.
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

/**
 * Edit an existing source's display name and/or manifest URL in place —
 * id, order and the builtIn flag survive, so edits never reorder the
 * toolbar or unlock a built-in for deletion. Editing a retired built-in
 * id is a no-op returning the input list.
 */
export function updateMarketSource(
  storage: Storage,
  sources: readonly MarketSource[],
  id: string,
  changes: { name?: string; url?: string },
): MarketSource[] {
  const next = sources.map((source) => {
    if (source.id !== id) return source;
    const name = changes.name?.trim();
    const url = changes.url?.trim();
    if ((name === undefined || name === "") && (url === undefined || url === "")) {
      return source;
    }
    return {
      ...source,
      ...(name !== undefined && name !== "" ? { name } : {}),
      ...(url !== undefined && url !== "" ? { url } : {}),
    };
  });
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
