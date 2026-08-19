/**
 * Source auto-discovery (skill flavor, structured after dsh-mcp-manager's
 * market/discover.ts). A market source URL can be one of two things and
 * the manifest fetcher figures out which at refresh time:
 *
 *   - a GitHub repository (github.com/{owner}/{repo} or
 *     .../tree/{ref}/{path}) → the GitHub adapter resolves the default
 *     branch (unless the URL pins a ref), lists the tree recursively and
 *     treats every directory holding a SKILL.md (under the pinned
 *     subpath, up to MAX_SKILL_DIRS entries) as one market item; each
 *     item's payload.url points back at a tree URL the host importer
 *     already understands (repo root uses the plain repo URL)
 *   - any other http(s) URL → fetched directly; the response must be our
 *     manifest envelope ({items: []}), fully backward compatible
 *
 * Everything here is pure functions plus an injected `fetch` so the whole
 * ladder is unit-testable without network access. Localizable strings are
 * injected as a `DiscoverStrings` record with Chinese defaults; the shelf
 * passes its locale dictionary so users see translated errors.
 */
import { parseManifest, type MarketItem } from "./types.ts";

/** Per-request timeout for every discovery fetch (branch / tree / raw). */
export const DISCOVER_TIMEOUT_MS = 15_000;

/** Cap on scanned SKILL.md directories per GitHub source. */
export const MAX_SKILL_DIRS = 50;

/** Only the head of each SKILL.md is read (frontmatter lives up top). */
export const SKILL_HEAD_LIMIT = 8 * 1024;

export type FetchLike = typeof fetch;

/** A GitHub repository URL, with an optional pinned ref and subpath. */
export interface GitHubTarget {
  readonly kind: "github";
  readonly owner: string;
  readonly repo: string;
  readonly ref?: string;
  readonly subpath?: string;
}

/** Any other http(s) URL, fetched and parsed as a manifest envelope. */
export interface DirectTarget {
  readonly kind: "direct";
  readonly url: string;
}

export type SourceTarget = GitHubTarget | DirectTarget;

/** Localizable strings the discovery ladder can surface in the UI. */
export interface DiscoverStrings {
  /** Fallback item description: "来自 {repo} 的 Skill". */
  readonly fallbackDescription: (label: string) => string;
  /** Repo (or subpath) carries no SKILL.md at all. */
  readonly noSkills: (label: string) => string;
  readonly repoNotFound: (label: string) => string;
  readonly unauthorized: (status: number) => string;
  readonly rateLimited: () => string;
  readonly invalidJson: () => string;
  /** Direct response is not a manifest envelope. */
  readonly invalidManifest: () => string;
  readonly invalidUrl: () => string;
}

export const DEFAULT_DISCOVER_STRINGS: DiscoverStrings = {
  fallbackDescription: (label) => `来自 ${label} 的 Skill`,
  noSkills: (label) => `该仓库没有找到 SKILL.md（${label}）`,
  repoNotFound: (label) => `GitHub 仓库 ${label} 不存在或不可访问`,
  unauthorized: (status) => `访问被拒绝（HTTP ${status}）：可能为私有仓库或缺少访问凭证`,
  rateLimited: () => "请求触发 GitHub 限流，请稍后再试",
  invalidJson: () => "响应不是有效 JSON",
  invalidManifest: () => "链接返回的不是市场清单（items）",
  invalidUrl: () => "源地址无效：支持 GitHub 仓库地址或自定义清单",
};

export type DiscoverOutcome =
  | {
      readonly state: "ok";
      readonly items: readonly MarketItem[];
      readonly name?: string;
      readonly description?: string;
    }
  | { readonly state: "offline"; readonly error: string }
  | { readonly state: "invalid"; readonly error: string };

/**
 * Be liberal with user input: trim, and when no scheme is present assume
 * https so "github.com/owner/repo" pasted without a scheme still works.
 * Values that already carry a scheme are kept verbatim — including
 * non-http ones (javascript:, …), which classifySourceUrl then rejects.
 */
export function normalizeSourceUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "") return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Classify a source URL. Returns undefined when the value cannot be any
 * kind of fetchable source (no scheme we understand, empty, …).
 */
export function classifySourceUrl(input: string): SourceTarget | undefined {
  const url = normalizeSourceUrl(input);
  if (url === "") return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return undefined;
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "github.com" || host === "www.github.com") {
    const segments = parsed.pathname.split("/").filter((part) => part !== "");
    const owner = segments[0];
    if (owner === undefined) return undefined;
    let repo = segments[1];
    if (repo === undefined) return undefined;
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);
    if (repo === "") return undefined;
    if (segments[2] === "tree") {
      const ref = segments[3];
      if (ref !== undefined) {
        const sub = segments.slice(4).join("/").replace(/^\/+|\/+$/g, "");
        return {
          kind: "github",
          owner,
          repo,
          ref,
          ...(sub === "" ? {} : { subpath: sub }),
        };
      }
    }
    return { kind: "github", owner, repo };
  }
  return { kind: "direct", url: parsed.toString() };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** name / description lifted out of a SKILL.md frontmatter head. */
export interface SkillFrontmatter {
  readonly name?: string;
  readonly description?: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const KEY_VALUE_PATTERN = /^([A-Za-z0-9][A-Za-z0-9_-]*):[ \t]*(.*)$/;
const BLOCK_SCALAR_PREFIXES = new Set([
  ">",
  ">-",
  ">+",
  "|",
  "|-",
  "|+",
]);

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1).trim();
    }
  }
  return value.trim();
}

/**
 * Minimal frontmatter reader for display purposes: pulls the top-level
 * `name` and `description` scalars (quoted or block-folded) out of the
 * leading `---` block. Deliberately not a full YAML parser — the loader
 * validates skills at install time; here we only need a label.
 */
export function parseSkillFrontmatter(head: string): SkillFrontmatter {
  const match = FRONTMATTER_PATTERN.exec(head.slice(0, SKILL_HEAD_LIMIT));
  if (match === null) return {};
  const lines = (match[1] ?? "").split(/\r?\n/);
  const values = new Map<string, string>();
  let folding: { readonly key: string; readonly parts: string[] } | undefined =
    undefined;
  const flush = (): void => {
    if (folding !== undefined) {
      values.set(folding.key, folding.parts.join(" ").trim());
      folding = undefined;
    }
  };
  for (const line of lines) {
    if (folding !== undefined && /^[ \t]+\S/.test(line)) {
      folding.parts.push(line.trim());
      continue;
    }
    flush();
    const keyValue = KEY_VALUE_PATTERN.exec(line);
    if (keyValue === null) continue;
    const key = keyValue[1] ?? "";
    const value = (keyValue[2] ?? "").trim();
    if (BLOCK_SCALAR_PREFIXES.has(value)) {
      folding = { key, parts: [] };
      continue;
    }
    values.set(key, unquote(value));
  }
  flush();
  const name = values.get("name");
  const description = values.get("description");
  return {
    ...(name !== undefined && name !== "" ? { name } : {}),
    ...(description !== undefined && description !== ""
      ? { description }
      : {}),
  };
}

function dirDepth(dir: string): number {
  return dir === "" ? 0 : dir.split("/").length;
}

/**
 * Extract the directories that directly hold a SKILL.md blob from a
 * git/trees `?recursive=1` response, restricted to the pinned subpath,
 * capped at MAX_SKILL_DIRS. Shallow entries sort first, then by path.
 */
export function skillDirsFromTree(
  tree: unknown,
  subpath?: string,
): string[] {
  if (!isPlainObject(tree) || !Array.isArray(tree["tree"])) return [];
  const prefix =
    subpath === undefined || subpath === ""
      ? ""
      : subpath.replace(/^\/+|\/+$/g, "");
  const dirs = new Set<string>();
  for (const entry of tree["tree"]) {
    if (!isPlainObject(entry)) continue;
    const path = entry["path"];
    if (typeof path !== "string" || path === "" || entry["type"] === "tree") {
      continue;
    }
    if (path !== "SKILL.md" && !path.endsWith("/SKILL.md")) continue;
    const dir = path === "SKILL.md" ? "" : path.slice(0, -"/SKILL.md".length);
    if (prefix !== "" && dir !== prefix && !dir.startsWith(`${prefix}/`)) {
      continue;
    }
    dirs.add(dir);
  }
  return [...dirs]
    .sort((a, b) => dirDepth(a) - dirDepth(b) || a.localeCompare(b))
    .slice(0, MAX_SKILL_DIRS);
}

/** Install URL for one discovered directory (host resolveSourceUrl speaks both). */
export function githubSkillUrl(
  target: GitHubTarget,
  ref: string,
  dir: string,
): string {
  if (dir === "") {
    return target.ref === undefined
      ? `https://github.com/${target.owner}/${target.repo}`
      : `https://github.com/${target.owner}/${target.repo}/tree/${target.ref}`;
  }
  return `https://github.com/${target.owner}/${target.repo}/tree/${ref}/${dir}`;
}

/** Same dialect the loader enforces: kebab-case skill names. */
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Build one market item for a discovered directory. The id doubles as the
 * skill name so the shelf's isInstalled / update checks line up with the
 * installed catalog (the loader requires name == directory anyway).
 */
export function githubItemForDir(
  target: GitHubTarget,
  ref: string,
  dir: string,
  frontmatter: SkillFrontmatter,
  strings: DiscoverStrings = DEFAULT_DISCOVER_STRINGS,
): MarketItem {
  const label = `${target.owner}/${target.repo}`;
  const fallbackName =
    dir === "" ? target.repo : (dir.split("/").at(-1) ?? target.repo);
  const name =
    frontmatter.name !== undefined && SKILL_NAME_PATTERN.test(frontmatter.name)
      ? frontmatter.name
      : fallbackName;
  const description =
    frontmatter.description !== undefined && frontmatter.description !== ""
      ? frontmatter.description
      : strings.fallbackDescription(label);
  return {
    id: name,
    name,
    description,
    tags: ["github"],
    author: target.owner,
    kind: "skill",
    payload: { url: githubSkillUrl(target, ref, dir) },
  };
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/** Standard headers; api.github.com requires a user-agent. */
function discoverHeaders(): Record<string, string> {
  return {
    accept: "application/json",
    "user-agent": "dsh-skill-manager/0.1 (+marketplace)",
  };
}

function rawHeaders(): Record<string, string> {
  return {
    accept: "text/plain",
    "user-agent": "dsh-skill-manager/0.1 (+marketplace)",
    range: `bytes=0-${SKILL_HEAD_LIMIT - 1}`,
  };
}

function offlineFrom(error: unknown): { state: "offline"; error: string } {
  return {
    state: "offline",
    error: error instanceof Error ? error.message : String(error),
  };
}

/** GET api.github.com/repos/{owner}/{repo} → default_branch, "main" fallback. */
async function resolveDefaultBranch(
  target: GitHubTarget,
  fetcher: FetchLike,
  timeoutMs: number,
  strings: DiscoverStrings,
): Promise<string | { readonly state: "offline"; readonly error: string }> {
  const label = `${target.owner}/${target.repo}`;
  let response: Response;
  try {
    response = await fetcher(
      `https://api.github.com/repos/${target.owner}/${target.repo}`,
      {
        headers: discoverHeaders(),
        signal: timeoutSignal(timeoutMs),
        redirect: "follow",
      },
    );
  } catch (error) {
    return offlineFrom(error);
  }
  if (response.status === 404) {
    return { state: "offline", error: strings.repoNotFound(label) };
  }
  if (response.status === 429 || response.status === 403) {
    return { state: "offline", error: strings.rateLimited() };
  }
  if (response.status === 401) {
    return { state: "offline", error: strings.unauthorized(response.status) };
  }
  try {
    const body: unknown = await response.json();
    if (isPlainObject(body) && typeof body["default_branch"] === "string") {
      const branch = body["default_branch"];
      if (branch !== "") return branch;
    }
  } catch {
    // fall through to the default below
  }
  return "main";
}

/**
 * GitHub adapter: resolve the branch (unless pinned) → list the tree
 * recursively → fetch each SKILL.md head → one item per directory.
 */
async function discoverGitHub(
  target: GitHubTarget,
  fetcher: FetchLike,
  timeoutMs: number,
  strings: DiscoverStrings,
): Promise<DiscoverOutcome> {
  const label = `${target.owner}/${target.repo}`;
  let ref = target.ref;
  if (ref === undefined) {
    const branch = await resolveDefaultBranch(target, fetcher, timeoutMs, strings);
    if (typeof branch !== "string") return branch;
    ref = branch;
  }
  let response: Response;
  try {
    response = await fetcher(
      `https://api.github.com/repos/${target.owner}/${target.repo}/git/trees/${ref}?recursive=1`,
      {
        headers: discoverHeaders(),
        signal: timeoutSignal(timeoutMs),
        redirect: "follow",
      },
    );
  } catch (error) {
    return offlineFrom(error);
  }
  if (response.status === 404) {
    return { state: "offline", error: strings.repoNotFound(label) };
  }
  if (response.status === 401 || response.status === 403 || response.status === 429) {
    return {
      state: "offline",
      error:
        response.status === 429
          ? strings.rateLimited()
          : strings.unauthorized(response.status),
    };
  }
  if (!response.ok) {
    return { state: "offline", error: `HTTP ${response.status}` };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { state: "invalid", error: strings.invalidJson() };
  }
  const dirs = skillDirsFromTree(body, target.subpath);
  if (dirs.length === 0) {
    return { state: "invalid", error: strings.noSkills(label) };
  }
  const items: MarketItem[] = [];
  for (const dir of dirs) {
    const rawUrl = `https://raw.githubusercontent.com/${target.owner}/${target.repo}/${ref}/${
      dir === "" ? "" : `${dir}/`
    }SKILL.md`;
    let raw: Response;
    try {
      raw = await fetcher(rawUrl, {
        headers: rawHeaders(),
        signal: timeoutSignal(timeoutMs),
        redirect: "follow",
      });
    } catch (error) {
      return offlineFrom(error);
    }
    if (
      raw.status === 401 ||
      raw.status === 403 ||
      raw.status === 429
    ) {
      // Auth / rate-limit errors won't improve across directories.
      return {
        state: "offline",
        error:
          raw.status === 429 ? strings.rateLimited() : strings.unauthorized(raw.status),
      };
    }
    if (!raw.ok) continue; // tree moved on between calls — skip the entry
    const head = (await raw.text()).slice(0, SKILL_HEAD_LIMIT);
    items.push(githubItemForDir(target, ref, dir, parseSkillFrontmatter(head), strings));
  }
  if (items.length === 0) {
    return { state: "invalid", error: strings.noSkills(label) };
  }
  return { state: "ok", items, description: `GitHub · ${label}` };
}

/** Direct adapter: manifest envelope ({items}) only. */
async function discoverDirect(
  target: DirectTarget,
  fetcher: FetchLike,
  timeoutMs: number,
  strings: DiscoverStrings,
): Promise<DiscoverOutcome> {
  let response: Response;
  try {
    response = await fetcher(target.url, {
      headers: discoverHeaders(),
      signal: timeoutSignal(timeoutMs),
      redirect: "follow",
    });
  } catch (error) {
    return offlineFrom(error);
  }
  if (response.status === 401 || response.status === 403) {
    return { state: "offline", error: strings.unauthorized(response.status) };
  }
  if (response.status === 429) {
    return { state: "offline", error: strings.rateLimited() };
  }
  if (!response.ok) {
    return { state: "offline", error: `HTTP ${response.status}` };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { state: "invalid", error: strings.invalidJson() };
  }
  if (isPlainObject(body) && Array.isArray(body["items"])) {
    try {
      const envelope = parseManifest(body);
      return {
        state: "ok",
        items: envelope.items,
        ...(envelope.name === undefined ? {} : { name: envelope.name }),
        ...(envelope.description === undefined
          ? {}
          : { description: envelope.description }),
      };
    } catch (error) {
      return {
        state: "invalid",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return { state: "invalid", error: strings.invalidManifest() };
}

/**
 * Discover one source URL end to end. Pure given (url, fetcher); used by
 * the manifest fetcher so every existing call site gains discovery.
 */
export async function discoverSource(
  url: string,
  fetcher: FetchLike = fetch,
  timeoutMs: number = DISCOVER_TIMEOUT_MS,
  strings: DiscoverStrings = DEFAULT_DISCOVER_STRINGS,
): Promise<DiscoverOutcome> {
  const target = classifySourceUrl(url);
  if (target === undefined) {
    return { state: "invalid", error: strings.invalidUrl() };
  }
  if (target.kind === "github") {
    return discoverGitHub(target, fetcher, timeoutMs, strings);
  }
  return discoverDirect(target, fetcher, timeoutMs, strings);
}
