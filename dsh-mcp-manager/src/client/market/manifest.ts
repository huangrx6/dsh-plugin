/**
 * Manifest fetcher. The marketplace can list many sources, each with its
 * own URL; the fetcher pulls them in parallel and surfaces per-source
 * status so the UI can show "online" / "offline" / "invalid" badges.
 *
 * Discovery: every source URL is first classified (see ./discover.ts) —
 * GitHub repository URLs go through the GitHub adapter (.mcp.json /
 * mcp.json), everything else is fetched directly and accepts either our
 * manifest envelope ({items: []}) or an mcp.json document ({mcpServers}),
 * so existing custom manifests keep working unchanged.
 *
 * Caching: the fetcher uses an in-memory TTL cache keyed by URL. This is
 * not a substitute for HTTP caching (the browser already does that), but
 * it stops the same source from being re-fetched across simultaneous
 * component mounts and survives within a single page session.
 *
 * Implementation note: we deliberately use `fetch` and `AbortSignal.timeout`
 * for clear timeout semantics. DSH plugins run in both loopback and remote
 * browsers; the runtime transport doesn't expose a JS fetch polyfill here.
 */
import {
  DEFAULT_DISCOVER_STRINGS,
  DISCOVER_TIMEOUT_MS,
  discoverSource,
  type DiscoverStrings,
} from "./discover.ts";
import type { ManifestEnvelope, MarketSource, MarketSourceState } from "./types.ts";

const CACHE_TTL_MS = 60_000;

interface FetchOk {
  readonly state: "ok";
  readonly envelope: ManifestEnvelope;
  readonly fetchedAt: number;
}
interface FetchFail {
  readonly state: "offline";
  readonly error: string;
  readonly fetchedAt: number;
}
interface FetchInvalid {
  readonly state: "invalid";
  readonly error: string;
  readonly fetchedAt: number;
}

export type FetchResult = FetchOk | FetchFail | FetchInvalid;

const cache = new Map<string, FetchResult>();

export function clearManifestCache(): void {
  cache.clear();
}

export async function fetchManifest(
  source: MarketSource,
  fetcher: typeof fetch = fetch,
  timeoutMs: number = DISCOVER_TIMEOUT_MS,
  strings: DiscoverStrings = DEFAULT_DISCOVER_STRINGS,
): Promise<FetchResult> {
  const cached = cache.get(source.url);
  if (cached !== undefined && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }
  const outcome = await discoverSource(source.url, fetcher, timeoutMs, strings);
  let result: FetchResult;
  if (outcome.state === "ok") {
    const envelope: ManifestEnvelope = {
      ...(outcome.name === undefined ? {} : { name: outcome.name }),
      ...(outcome.description === undefined
        ? {}
        : { description: outcome.description }),
      items: outcome.items,
    };
    result = { state: "ok", envelope, fetchedAt: Date.now() };
  } else if (outcome.state === "offline") {
    result = { state: "offline", error: outcome.error, fetchedAt: Date.now() };
  } else {
    result = { state: "invalid", error: outcome.error, fetchedAt: Date.now() };
  }
  cache.set(source.url, result);
  return result;
}

export interface SourceSnapshot {
  readonly source: MarketSource;
  readonly state: MarketSourceState;
  readonly error?: string;
  readonly items?: readonly import("./types.ts").MarketItem[];
  readonly fetchedAt: number;
}

export async function fetchAllManifests(
  sources: readonly MarketSource[],
  fetcher: typeof fetch = fetch,
  strings: DiscoverStrings = DEFAULT_DISCOVER_STRINGS,
): Promise<SourceSnapshot[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      const result = await fetchManifest(source, fetcher, DISCOVER_TIMEOUT_MS, strings);
      if (result.state === "ok") {
        const snapshot: SourceSnapshot = {
          source,
          state: "ok",
          items: result.envelope.items,
          fetchedAt: result.fetchedAt,
        };
        return snapshot;
      }
      if (result.state === "offline") {
        const snapshot: SourceSnapshot = {
          source,
          state: "offline",
          error: result.error,
          fetchedAt: result.fetchedAt,
        };
        return snapshot;
      }
      const snapshot: SourceSnapshot = {
        source,
        state: "invalid",
        error: result.error,
        fetchedAt: result.fetchedAt,
      };
      return snapshot;
    }),
  );
  return results;
}
