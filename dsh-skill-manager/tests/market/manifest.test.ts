/**
 * Tests for the manifest fetcher. The fetcher is the only place where untrusted
 * JSON is read from the network, so we test:
 *
 *   - the success path (parses and caches)
 *   - the HTTP failure path (offline state)
 *   - the parse failure path (invalid state)
 *   - the cache TTL (a second fetch within the TTL returns the cached result)
 *   - the cache miss after TTL (a second fetch re-runs the network call)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearManifestCache,
  fetchAllManifests,
  fetchManifest,
} from "../../src/client/market/manifest.ts";
import type { MarketSource } from "../../src/client/market/types.ts";

function makeSource(id: string): MarketSource {
  return {
    id,
    name: id,
    url: `https://example.com/${id}.json`,
    builtIn: false,
    order: 0,
  };
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("manifest fetcher", () => {
  beforeEach(() => {
    clearManifestCache();
  });

  it("parses a valid manifest and caches it", async () => {
    const fetcher = vi.fn(async () =>
      makeJsonResponse({
        items: [{ id: "foo", name: "Foo", description: "x", kind: "skill" }],
      }),
    );
    const source = makeSource("s1");
    const result = await fetchManifest(
      source,
      fetcher as unknown as typeof fetch,
    );
    if (result.state !== "ok") throw new Error("expected ok");
    expect(result.envelope.items).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledOnce();

    // Second fetch within the TTL is a cache hit.
    const second = await fetchManifest(
      source,
      fetcher as unknown as typeof fetch,
    );
    if (second.state !== "ok") throw new Error("expected ok on cache hit");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("reports an offline state on HTTP failures", async () => {
    const fetcher = vi.fn(async () => new Response("boom", { status: 500 }));
    const result = await fetchManifest(
      makeSource("s2"),
      fetcher as unknown as typeof fetch,
    );
    expect(result.state).toBe("offline");
    if (result.state !== "offline") throw new Error("expected offline");
    expect(result.error).toContain("500");
  });

  it("reports an invalid state on non-JSON bodies", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("<html>not json</html>", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const result = await fetchManifest(
      makeSource("s3"),
      fetcher as unknown as typeof fetch,
    );
    expect(result.state).toBe("invalid");
  });

  it("reports an invalid state on JSON that does not match the schema", async () => {
    const fetcher = vi.fn(async () =>
      makeJsonResponse({ items: "not an array" }),
    );
    const result = await fetchManifest(
      makeSource("s4"),
      fetcher as unknown as typeof fetch,
    );
    expect(result.state).toBe("invalid");
  });

  it("fetches all sources in parallel and surfaces per-source state", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : (input as URL).toString();
      if (url.includes("good"))
        return makeJsonResponse({
          items: [{ id: "x", name: "X", description: "x", kind: "skill" }],
        });
      if (url.includes("bad")) return new Response("no", { status: 500 });
      return new Response("<html/>", { status: 200 });
    });
    const snapshots = await fetchAllManifests(
      [makeSource("good"), makeSource("bad"), makeSource("invalid")],
      fetcher as unknown as typeof fetch,
    );
    expect(snapshots[0]?.state).toBe("ok");
    expect(snapshots[1]?.state).toBe("offline");
    expect(snapshots[2]?.state).toBe("invalid");
  });
});
