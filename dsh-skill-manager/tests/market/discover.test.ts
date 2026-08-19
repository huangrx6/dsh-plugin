/**
 * Tests for the source auto-discovery ladder (see src/client/market/discover.ts):
 *
 *   - URL classification (GitHub repo / tree URLs / direct fetches)
 *   - the tree scan → SKILL.md directories mapping (subpath + cap)
 *   - frontmatter name / description parsing (quoted, folded, missing)
 *   - the GitHub adapter end to end (branch resolution, per-dir items)
 *   - the direct adapter (manifest envelope stays fully compatible)
 *   - readable error paths (404 / 403 / 429 / no SKILL.md)
 *   - the manifest fetcher integration
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  classifySourceUrl,
  discoverSource,
  githubItemForDir,
  githubSkillUrl,
  MAX_SKILL_DIRS,
  normalizeSourceUrl,
  parseSkillFrontmatter,
  skillDirsFromTree,
} from "../../src/client/market/discover.ts";
import {
  clearManifestCache,
  fetchAllManifests,
  fetchManifest,
} from "../../src/client/market/manifest.ts";
import type { MarketSource } from "../../src/client/market/types.ts";

/** Minimal fetch stand-in routed by URL substring; keeps tests offline. */
interface RoutedFetch {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  calls: string[];
}
function routeFetch(
  routes: ReadonlyArray<{
    readonly match: string;
    readonly status?: number;
    readonly body?: unknown;
    readonly raw?: string;
  }>,
): RoutedFetch {
  const calls: string[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    void init;
    const route = routes.find((entry) => url.includes(entry.match));
    if (route === undefined) {
      return new Response("not found", { status: 404 });
    }
    const body = route.raw ?? JSON.stringify(route.body ?? {});
    return new Response(body, {
      status: route.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  }) as RoutedFetch;
  fetcher.calls = calls;
  return fetcher;
}

const source = (url: string): MarketSource => ({
  id: "s1",
  name: "Test",
  url,
  builtIn: false,
  order: 0,
});

describe("normalizeSourceUrl", () => {
  it("prepends https:// when the scheme is missing", () => {
    expect(normalizeSourceUrl("github.com/a/b")).toBe("https://github.com/a/b");
    expect(normalizeSourceUrl("  example.com/m.json ")).toBe(
      "https://example.com/m.json",
    );
  });
  it("keeps existing schemes and rejects only emptiness", () => {
    expect(normalizeSourceUrl("http://example.com/x")).toBe(
      "http://example.com/x",
    );
    expect(normalizeSourceUrl("HTTPS://example.com/x")).toBe(
      "HTTPS://example.com/x",
    );
    expect(normalizeSourceUrl("   ")).toBe("");
  });
});

describe("classifySourceUrl", () => {
  it("classifies a bare GitHub repo URL", () => {
    expect(classifySourceUrl("https://github.com/owner/repo")).toEqual({
      kind: "github",
      owner: "owner",
      repo: "repo",
    });
  });
  it("strips .git and tolerates a missing scheme / trailing slash", () => {
    expect(classifySourceUrl("github.com/owner/repo.git/")).toEqual({
      kind: "github",
      owner: "owner",
      repo: "repo",
    });
  });
  it("parses tree URLs into ref + subpath", () => {
    expect(
      classifySourceUrl("https://github.com/owner/repo/tree/main/skills/pdf"),
    ).toEqual({
      kind: "github",
      owner: "owner",
      repo: "repo",
      ref: "main",
      subpath: "skills/pdf",
    });
  });
  it("accepts a tree URL without a subpath", () => {
    expect(classifySourceUrl("https://github.com/owner/repo/tree/dev")).toEqual({
      kind: "github",
      owner: "owner",
      repo: "repo",
      ref: "dev",
    });
  });
  it("treats non-github and non-repo URLs as direct fetches", () => {
    expect(classifySourceUrl("https://example.com/manifest.json")).toEqual({
      kind: "direct",
      url: "https://example.com/manifest.json",
    });
    expect(
      classifySourceUrl("https://raw.githubusercontent.com/o/r/main/SKILL.md"),
    ).toEqual({
      kind: "direct",
      url: "https://raw.githubusercontent.com/o/r/main/SKILL.md",
    });
    expect(classifySourceUrl("https://github.com/only-owner")).toBeUndefined();
  });
  it("rejects non-http schemes and garbage", () => {
    expect(classifySourceUrl("ftp://example.com/x")).toBeUndefined();
    expect(classifySourceUrl("")).toBeUndefined();
    expect(classifySourceUrl("http://")).toBeUndefined();
  });
});

describe("parseSkillFrontmatter", () => {
  it("reads plain and quoted name / description scalars", () => {
    const parsed = parseSkillFrontmatter(
      "---\nname: pdf\ndescription: \"Make PDFs\"\n---\n\nbody",
    );
    expect(parsed).toEqual({ name: "pdf", description: "Make PDFs" });
  });
  it("joins block-folded descriptions", () => {
    const parsed = parseSkillFrontmatter(
      "---\nname: pdf\ndescription: >-\n  one\n  two\nwhenToUse: later\n---\n",
    );
    expect(parsed).toEqual({ name: "pdf", description: "one two" });
  });
  it("returns an empty record without a frontmatter block", () => {
    expect(parseSkillFrontmatter("# just markdown\n\nbody")).toEqual({});
    expect(parseSkillFrontmatter("---\nnot closed")).toEqual({});
  });
  it("ignores nested keys and keeps values that are not names", () => {
    const parsed = parseSkillFrontmatter(
      "---\nmetadata:\n  a: 1\ndescription: desc\n---\n",
    );
    expect(parsed).toEqual({ description: "desc" });
  });
});

describe("skillDirsFromTree", () => {
  const tree = {
    tree: [
      { path: "README.md", type: "blob" },
      { path: "SKILL.md", type: "blob" },
      { path: "skills/pdf/SKILL.md", type: "blob" },
      { path: "skills/pdf/scripts/run.py", type: "blob" },
      { path: "skills/pdf", type: "tree" },
      { path: "skills/docx/SKILL.md", type: "blob" },
      { path: "skills/docx/assets/logo.svg", type: "blob" },
      { path: "docs/guide.md", type: "blob" },
    ],
  };

  it("collects every directory that directly holds a SKILL.md", () => {
    expect(skillDirsFromTree(tree)).toEqual(["", "skills/docx", "skills/pdf"]);
  });
  it("restricts results to the pinned subpath (nested included)", () => {
    expect(skillDirsFromTree(tree, "skills")).toEqual([
      "skills/docx",
      "skills/pdf",
    ]);
    expect(skillDirsFromTree(tree, "skills/pdf")).toEqual(["skills/pdf"]);
  });
  it("caps the scan at MAX_SKILL_DIRS and tolerates junk", () => {
    const big = {
      tree: Array.from({ length: MAX_SKILL_DIRS + 10 }, (_, index) => ({
        path: `s${index}/SKILL.md`,
        type: "blob",
      })),
    };
    expect(skillDirsFromTree(big)).toHaveLength(MAX_SKILL_DIRS);
    expect(skillDirsFromTree("nope")).toEqual([]);
    expect(skillDirsFromTree({ tree: "nope" })).toEqual([]);
    expect(skillDirsFromTree({})).toEqual([]);
  });
});

describe("githubItemForDir / githubSkillUrl", () => {
  it("uses the repo URL for a root SKILL.md and tree URLs for subdirs", () => {
    const target = classifySourceUrl("https://github.com/o/r");
    expect(target?.kind === "github").toBe(true);
    if (target?.kind !== "github") return;
    expect(githubSkillUrl(target, "main", "")).toBe("https://github.com/o/r");
    expect(githubSkillUrl(target, "main", "skills/pdf")).toBe(
      "https://github.com/o/r/tree/main/skills/pdf",
    );
  });
  it("keeps a pinned ref for the root entry", () => {
    const target = classifySourceUrl("https://github.com/o/r/tree/v1");
    if (target?.kind !== "github") throw new Error("expected github target");
    expect(githubSkillUrl(target, "v1", "")).toBe(
      "https://github.com/o/r/tree/v1",
    );
  });
  it("maps frontmatter onto the item and falls back to the dir name", () => {
    const target = classifySourceUrl("https://github.com/o/r");
    if (target?.kind !== "github") throw new Error("expected github target");
    const withFm = githubItemForDir(
      target,
      "main",
      "skills/pdf",
      { name: "pdf", description: "Make PDFs" },
    );
    expect(withFm).toEqual({
      id: "pdf",
      name: "pdf",
      description: "Make PDFs",
      tags: ["github"],
      author: "o",
      kind: "skill",
      payload: { url: "https://github.com/o/r/tree/main/skills/pdf" },
    });
    const withoutFm = githubItemForDir(target, "main", "skills/docx", {});
    expect(withoutFm.name).toBe("docx");
    expect(withoutFm.description).toBe("来自 o/r 的 Skill");
    expect(withoutFm.id).toBe("docx");
    // a non-kebab name cannot match the loader, so the dir name wins
    const badName = githubItemForDir(
      target,
      "main",
      "skills/pdf",
      { name: "Not Valid" },
    );
    expect(badName.name).toBe("pdf");
  });
});

describe("discoverSource (GitHub adapter)", () => {
  it("resolves the default branch, scans the tree and builds one item per SKILL.md", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/develop",
        body: {
          tree: [
            { path: "README.md", type: "blob" },
            { path: "skills/pdf/SKILL.md", type: "blob" },
            { path: "skills/docx/SKILL.md", type: "blob" },
          ],
        },
      },
      { match: "api.github.com/repos/o/r", body: { default_branch: "develop" } },
      {
        match: "raw.githubusercontent.com/o/r/develop/skills/pdf/SKILL.md",
        raw: "---\nname: pdf\ndescription: Make PDFs\n---\nbody",
      },
      {
        match: "raw.githubusercontent.com/o/r/develop/skills/docx/SKILL.md",
        raw: "# no frontmatter here",
      },
    ]);
    const outcome = await discoverSource("https://github.com/o/r", fetcher);
    expect(outcome.state).toBe("ok");
    if (outcome.state === "ok") {
      expect(outcome.description).toBe("GitHub · o/r");
      expect(outcome.items).toEqual([
        {
          id: "docx",
          name: "docx",
          description: "来自 o/r 的 Skill",
          tags: ["github"],
          author: "o",
          kind: "skill",
          payload: { url: "https://github.com/o/r/tree/develop/skills/docx" },
        },
        {
          id: "pdf",
          name: "pdf",
          description: "Make PDFs",
          tags: ["github"],
          author: "o",
          kind: "skill",
          payload: { url: "https://github.com/o/r/tree/develop/skills/pdf" },
        },
      ]);
    }
    expect(fetcher.calls).toEqual([
      "https://api.github.com/repos/o/r",
      "https://api.github.com/repos/o/r/git/trees/develop?recursive=1",
      "https://raw.githubusercontent.com/o/r/develop/skills/docx/SKILL.md",
      "https://raw.githubusercontent.com/o/r/develop/skills/pdf/SKILL.md",
    ]);
  });

  it("skips the branch lookup when the tree URL pins a ref and honors the subpath", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/v1",
        body: {
          tree: [
            { path: "outside/SKILL.md", type: "blob" },
            { path: "bundle/pdf/SKILL.md", type: "blob" },
          ],
        },
      },
      {
        match: "raw.githubusercontent.com/o/r/v1/bundle/pdf/SKILL.md",
        raw: "---\nname: pdf\ndescription: d\n---\n",
      },
    ]);
    const outcome = await discoverSource(
      "https://github.com/o/r/tree/v1/bundle",
      fetcher,
    );
    expect(outcome.state).toBe("ok");
    if (outcome.state === "ok") {
      expect(outcome.items).toHaveLength(1);
      expect(outcome.items[0]?.payload).toEqual({
        url: "https://github.com/o/r/tree/v1/bundle/pdf",
      });
    }
    expect(fetcher.calls.some((call) => call.includes("raw.githubusercontent.com/o/r/v1/bundle/pdf/SKILL.md"))).toBe(
      true,
    );
    // the pinned ref skips the repos lookup entirely: the tree call is first
    expect(fetcher.calls[0]).toBe(
      "https://api.github.com/repos/o/r/git/trees/v1?recursive=1",
    );
  });

  it("lists a repo-root SKILL.md as a single entry pointing at the repo URL", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/main",
        body: { tree: [{ path: "SKILL.md", type: "blob" }] },
      },
      { match: "api.github.com/repos/o/r", body: { default_branch: "main" } },
      {
        match: "raw.githubusercontent.com/o/r/main/SKILL.md",
        raw: "---\nname: solo\ndescription: root skill\n---\n",
      },
    ]);
    const outcome = await discoverSource("github.com/o/r", fetcher);
    expect(outcome.state).toBe("ok");
    if (outcome.state === "ok") {
      expect(outcome.items).toEqual([
        {
          id: "solo",
          name: "solo",
          description: "root skill",
          tags: ["github"],
          author: "o",
          kind: "skill",
          payload: { url: "https://github.com/o/r" },
        },
      ]);
    }
  });

  it("falls back to main when the branch lookup fails to parse", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/main",
        body: { tree: [{ path: "SKILL.md", type: "blob" }] },
      },
      { match: "api.github.com/repos/o/r", body: "not-an-object" },
      {
        match: "raw.githubusercontent.com/o/r/main/SKILL.md",
        raw: "---\nname: solo\ndescription: d\n---\n",
      },
    ]);
    const outcome = await discoverSource("https://github.com/o/r", fetcher);
    expect(outcome.state).toBe("ok");
    expect(fetcher.calls[1]).toContain("/git/trees/main?");
  });

  it("reports the friendly no-skills error when the tree has no SKILL.md", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/main",
        body: { tree: [{ path: "README.md", type: "blob" }] },
      },
      { match: "api.github.com/repos/o/r", body: { default_branch: "main" } },
    ]);
    const outcome = await discoverSource("https://github.com/o/r", fetcher);
    expect(outcome).toMatchObject({
      state: "invalid",
      error: expect.stringContaining("该仓库没有找到 SKILL.md"),
    });
  });

  it("maps api 404 to repo-not-found and 403 to rate limiting", async () => {
    const notFound = await discoverSource(
      "https://github.com/o/missing",
      routeFetch([{ match: "api.github.com/repos/o/missing", status: 404 }]),
    );
    expect(notFound).toMatchObject({
      state: "offline",
      error: expect.stringContaining("不存在或不可访问"),
    });
    const limited = await discoverSource(
      "https://github.com/o/r",
      routeFetch([{ match: "api.github.com/repos/o/r", status: 403 }]),
    );
    expect(limited).toMatchObject({
      state: "offline",
      error: "请求触发 GitHub 限流，请稍后再试",
    });
  });

  it("surfaces a raw 403 as access-denied instead of no-skills", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/main",
        body: { tree: [{ path: "SKILL.md", type: "blob" }] },
      },
      { match: "api.github.com/repos/o/r", body: { default_branch: "main" } },
      { match: "raw.githubusercontent.com", status: 403 },
    ]);
    const outcome = await discoverSource("https://github.com/o/r", fetcher);
    expect(outcome).toMatchObject({
      state: "offline",
      error: expect.stringContaining("访问被拒绝（HTTP 403）"),
    });
  });

  it("skips entries whose raw SKILL.md vanished and turns network failures offline", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/main",
        body: {
          tree: [
            { path: "a/SKILL.md", type: "blob" },
            { path: "b/SKILL.md", type: "blob" },
          ],
        },
      },
      { match: "api.github.com/repos/o/r", body: { default_branch: "main" } },
      { match: "raw.githubusercontent.com/o/r/main/a/SKILL.md", status: 404 },
      {
        match: "raw.githubusercontent.com/o/r/main/b/SKILL.md",
        raw: "---\nname: b\ndescription: d\n---\n",
      },
    ]);
    const outcome = await discoverSource("https://github.com/o/r", fetcher);
    expect(outcome.state).toBe("ok");
    if (outcome.state === "ok") {
      expect(outcome.items.map((item) => item.id)).toEqual(["b"]);
    }

    const broken = (async () => {
      throw new Error("boom");
    }) as typeof fetch;
    const offline = await discoverSource("https://github.com/o/r", broken);
    expect(offline).toMatchObject({ state: "offline", error: "boom" });
  });
});

describe("discoverSource (direct adapter)", () => {
  it("keeps the manifest envelope mode fully backward compatible", async () => {
    const fetcher = routeFetch([
      {
        match: "example.com/manifest.json",
        body: {
          name: "Custom",
          items: [{ id: "x", name: "X", description: "d", kind: "skill" }],
        },
      },
    ]);
    const outcome = await discoverSource("https://example.com/manifest.json", fetcher);
    expect(outcome.state).toBe("ok");
    if (outcome.state === "ok") {
      expect(outcome.name).toBe("Custom");
      expect(outcome.items.map((item) => item.id)).toEqual(["x"]);
    }
  });

  it("reports readable errors for 401 / 404 / 429 / non-JSON / wrong shape", async () => {
    const unauthorized = await discoverSource(
      "https://example.com/private.json",
      routeFetch([{ match: "private.json", status: 401 }]),
    );
    expect(unauthorized).toMatchObject({
      state: "offline",
      error: "访问被拒绝（HTTP 401）：可能为私有仓库或缺少访问凭证",
    });

    const missing = await discoverSource(
      "https://example.com/gone.json",
      routeFetch([{ match: "gone.json", status: 404 }]),
    );
    expect(missing).toMatchObject({ state: "offline", error: "HTTP 404" });

    const limited = await discoverSource(
      "https://example.com/limited.json",
      routeFetch([{ match: "limited.json", status: 429 }]),
    );
    expect(limited).toMatchObject({
      state: "offline",
      error: "请求触发 GitHub 限流，请稍后再试",
    });

    const html = new Response("<html>not json</html>", { status: 200 });
    const notJson = await discoverSource(
      "https://example.com/x.json",
      (async () => html) as typeof fetch,
    );
    expect(notJson).toMatchObject({ state: "invalid", error: "响应不是有效 JSON" });

    const neither = await discoverSource(
      "https://example.com/other.json",
      routeFetch([{ match: "other.json", body: { hello: "world" } }]),
    );
    expect(neither).toMatchObject({
      state: "invalid",
      error: expect.stringContaining("items"),
    });
  });

  it("rejects URLs that are not http(s) sources", async () => {
    const outcome = await discoverSource("javascript:alert(1)", routeFetch([]));
    expect(outcome.state).toBe("invalid");
    expect((outcome as { error: string }).error).toContain("源地址无效");
  });
});

describe("manifest fetcher integration", () => {
  beforeEach(() => {
    clearManifestCache();
  });

  it("discovers a GitHub source through fetchManifest / fetchAllManifests", async () => {
    const fetcher = routeFetch([
      {
        match: "git/trees/main",
        body: { tree: [{ path: "SKILL.md", type: "blob" }] },
      },
      { match: "api.github.com/repos/o/r", body: { default_branch: "main" } },
      {
        match: "raw.githubusercontent.com/o/r/main/SKILL.md",
        raw: "---\nname: solo\ndescription: d\n---\n",
      },
    ]);
    const result = await fetchManifest(source("https://github.com/o/r"), fetcher);
    expect(result.state).toBe("ok");
    if (result.state === "ok") {
      expect(result.envelope.items[0]?.name).toBe("solo");
      expect(result.envelope.description).toBe("GitHub · o/r");
    }
    clearManifestCache();
    const snapshots = await fetchAllManifests([source("https://github.com/o/r")], fetcher);
    expect(snapshots[0]?.state).toBe("ok");
    expect(snapshots[0]?.items?.[0]?.id).toBe("solo");
  });

  it("carries discovery errors into the snapshot state", async () => {
    clearManifestCache();
    const snapshots = await fetchAllManifests(
      [source("https://github.com/o/r")],
      routeFetch([{ match: "api.github.com/repos/o/r", status: 404 }]),
    );
    expect(snapshots[0]?.state).toBe("offline");
    expect(snapshots[0]?.error).toContain("不存在或不可访问");
  });
});
