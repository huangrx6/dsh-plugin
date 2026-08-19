/**
 * Source auto-discovery. A market source URL can now be one of three
 * things and the shelf figures out which at refresh time:
 *
 *   - a GitHub repository (github.com/{owner}/{repo} or
 *     .../tree/{ref}/{path}) → the GitHub adapter resolves the default
 *     branch (unless the URL pins a ref) and looks for .mcp.json /
 *     mcp.json at the subpath (then the repo root)
 *   - any other http(s) URL → fetched directly; the response is either
 *     our manifest envelope ({items: []}, fully backward compatible) or
 *     an mcp.json-style document ({mcpServers: {}}) whose entries become
 *     market items
 *
 * Everything here is pure functions plus an injected `fetch` so the whole
 * ladder is unit-testable without network access. Localizable strings are
 * injected as a `DiscoverStrings` record with Chinese defaults; the shelf
 * passes its locale dictionary so users see translated errors.
 */
import { parseManifest, type MarketItem } from "./types.ts";

/** Per-request timeout for every discovery fetch (branch lookup + raw). */
export const DISCOVER_TIMEOUT_MS = 15_000;

export type FetchLike = typeof fetch;

/** A GitHub repository URL, with an optional pinned ref and subpath. */
export interface GitHubTarget {
  readonly kind: "github";
  readonly owner: string;
  readonly repo: string;
  readonly ref?: string;
  readonly subpath?: string;
}

/** Any other http(s) URL, fetched and shape-sniffed directly. */
export interface DirectTarget {
  readonly kind: "direct";
  readonly url: string;
}

export type SourceTarget = GitHubTarget | DirectTarget;

/** Localizable strings the discovery ladder can surface in the UI. */
export interface DiscoverStrings {
  /** Fallback item description: "来自 {repo} 的 MCP 服务器". */
  readonly fallbackDescription: (label: string) => string;
  /** Repo (or subpath) carries no .mcp.json / mcp.json. */
  readonly noConfig: (label: string) => string;
  readonly repoNotFound: (label: string) => string;
  readonly unauthorized: (status: number) => string;
  readonly rateLimited: () => string;
  readonly invalidJson: () => string;
  /** Direct response is neither a manifest envelope nor mcpServers. */
  readonly invalidManifest: () => string;
  readonly invalidUrl: () => string;
}

export const DEFAULT_DISCOVER_STRINGS: DiscoverStrings = {
  fallbackDescription: (label) => `来自 ${label} 的 MCP 服务器`,
  noConfig: (label) => `该仓库没有 .mcp.json / mcp.json（${label}）`,
  repoNotFound: (label) => `GitHub 仓库 ${label} 不存在或不可访问`,
  unauthorized: (status) => `访问被拒绝（HTTP ${status}）：可能为私有仓库或缺少访问凭证`,
  rateLimited: () => "请求触发 GitHub 限流，请稍后再试",
  invalidJson: () => "响应不是有效 JSON",
  invalidManifest: () => "链接返回的既不是市场清单（items）也不是 MCP 配置（mcpServers）",
  invalidUrl: () => "源地址无效：支持 GitHub 仓库地址、.mcp.json 链接或自定义清单",
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

/** Keep only string→string pairs (mcp.json env / headers blocks). */
function cleanStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isPlainObject(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return Object.keys(out).length === 0 ? undefined : out;
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((entry): entry is string => typeof entry === "string");
  return out.length === 0 ? undefined : out;
}

/**
 * Map an mcp.json `mcpServers` object to market items. Each key becomes a
 * server; the value can be a bare stdio config ({command, args, env}), a
 * typed stdio config ({type:"stdio", ...}), or a URL config
 * ({type:"sse"|"http"|"url", url}). Entries we cannot map are skipped.
 */
export function mcpServersToItems(
  mcpServers: unknown,
  sourceLabel: string,
  strings: DiscoverStrings = DEFAULT_DISCOVER_STRINGS,
): MarketItem[] {
  if (!isPlainObject(mcpServers)) return [];
  const items: MarketItem[] = [];
  for (const [key, raw] of Object.entries(mcpServers)) {
    if (key === "") continue;
    if (!isPlainObject(raw)) continue;
    const command = typeof raw["command"] === "string" ? raw["command"] : undefined;
    const url = typeof raw["url"] === "string" ? raw["url"] : undefined;
    let payload: Record<string, unknown> | undefined;
    if (command !== undefined && command !== "") {
      const args = cleanStringArray(raw["args"]);
      const env = cleanStringRecord(raw["env"]);
      payload = {
        serverName: key,
        transport: "stdio",
        command,
        ...(args === undefined ? {} : { args }),
        ...(env === undefined ? {} : { env }),
      };
    } else if (url !== undefined && url !== "") {
      const headers = cleanStringRecord(raw["headers"]);
      payload = {
        serverName: key,
        transport: "sse",
        url,
        ...(headers === undefined ? {} : { headers }),
      };
    }
    if (payload === undefined) continue;
    const rawDescription = raw["description"];
    const description =
      typeof rawDescription === "string" && rawDescription.trim() !== ""
        ? rawDescription
        : strings.fallbackDescription(sourceLabel);
    const rawVersion = raw["version"];
    items.push({
      id: `mcp-${key}`,
      name: key,
      description,
      tags: ["github"],
      kind: "mcp",
      ...(typeof rawVersion === "string" && rawVersion !== ""
        ? { version: rawVersion }
        : {}),
      payload,
    });
  }
  return items;
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/** Standard headers; api.github.com requires a user-agent. */
function discoverHeaders(): Record<string, string> {
  return {
    accept: "application/json",
    "user-agent": "dsh-mcp-manager/0.1 (+marketplace)",
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
    response = await fetcher(`https://api.github.com/repos/${target.owner}/${target.repo}`, {
      headers: discoverHeaders(),
      signal: timeoutSignal(timeoutMs),
      redirect: "follow",
    });
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
 * Candidate raw URLs in priority order: the pinned subpath's .mcp.json /
 * mcp.json first, then the repo root's (accepted as a convenience when a
 * tree URL points at a subdirectory).
 */
export function rawConfigCandidates(target: GitHubTarget, ref: string): string[] {
  const base = `https://raw.githubusercontent.com/${target.owner}/${target.repo}/${ref}`;
  const sub = target.subpath === undefined ? "" : target.subpath.replace(/^\/+|\/+$/g, "");
  const candidates =
    sub === ""
      ? [`${base}/.mcp.json`, `${base}/mcp.json`]
      : [
          `${base}/${sub}/.mcp.json`,
          `${base}/${sub}/mcp.json`,
          `${base}/.mcp.json`,
          `${base}/mcp.json`,
        ];
  return [...new Set(candidates)];
}

/** GitHub adapter: branch lookup (unless pinned) → raw .mcp.json / mcp.json. */
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
  let hardError: string | undefined;
  for (const candidate of rawConfigCandidates(target, ref)) {
    let response: Response;
    try {
      response = await fetcher(candidate, {
        headers: discoverHeaders(),
        signal: timeoutSignal(timeoutMs),
        redirect: "follow",
      });
    } catch (error) {
      return offlineFrom(error);
    }
    if (response.status === 404) continue;
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      // Auth / rate-limit errors won't improve across candidates.
      return {
        state: "offline",
        error:
          response.status === 429
            ? strings.rateLimited()
            : strings.unauthorized(response.status),
      };
    }
    if (!response.ok) {
      hardError ??= `HTTP ${response.status}`;
      continue;
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      hardError ??= strings.invalidJson();
      continue;
    }
    if (!isPlainObject(body)) continue;
    const servers = body["mcpServers"];
    if (!isPlainObject(servers)) continue;
    return {
      state: "ok",
      items: mcpServersToItems(servers, label, strings),
      description: `GitHub · ${label}`,
    };
  }
  if (hardError !== undefined) return { state: "offline", error: hardError };
  return { state: "invalid", error: strings.noConfig(label) };
}

/** Direct adapter: manifest envelope ({items}) or mcp.json ({mcpServers}). */
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
  if (isPlainObject(body) && isPlainObject(body["mcpServers"])) {
    let label = target.url;
    try {
      label = new URL(target.url).hostname;
    } catch {
      // keep the raw url as label
    }
    return {
      state: "ok",
      items: mcpServersToItems(body["mcpServers"], label, strings),
    };
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
