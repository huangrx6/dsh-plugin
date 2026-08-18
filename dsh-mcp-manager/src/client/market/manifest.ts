/**
 * Manifest fetcher. The marketplace can list many sources, each with its
 * own URL; the fetcher pulls them in parallel and surfaces per-source
 * status so the UI can show "online" / "offline" / "invalid" badges.
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
  parseManifest,
  type ManifestEnvelope,
  type MarketSource,
  type MarketSourceState,
} from "./types.ts";

const DEFAULT_TIMEOUT_MS = 12_000;
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
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<FetchResult> {
  const cached = cache.get(source.url);
  if (cached !== undefined && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }
  let response: Response;
  try {
    response = await fetcher(source.url, {
      headers: {
        accept: "application/json",
        "user-agent": "dsh-launcher/0.1 (+marketplace)",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
  } catch (error) {
    const result: FetchFail = {
      state: "offline",
      error: error instanceof Error ? error.message : String(error),
      fetchedAt: Date.now(),
    };
    cache.set(source.url, result);
    return result;
  }
  if (!response.ok) {
    const result: FetchFail = {
      state: "offline",
      error: `HTTP ${response.status}`,
      fetchedAt: Date.now(),
    };
    cache.set(source.url, result);
    return result;
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    const result: FetchInvalid = {
      state: "invalid",
      error: error instanceof Error ? error.message : String(error),
      fetchedAt: Date.now(),
    };
    cache.set(source.url, result);
    return result;
  }
  try {
    const envelope = parseManifest(body);
    const result: FetchOk = { state: "ok", envelope, fetchedAt: Date.now() };
    cache.set(source.url, result);
    return result;
  } catch (error) {
    const result: FetchInvalid = {
      state: "invalid",
      error: error instanceof Error ? error.message : String(error),
      fetchedAt: Date.now(),
    };
    cache.set(source.url, result);
    return result;
  }
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
): Promise<SourceSnapshot[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      const result = await fetchManifest(source, fetcher);
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
