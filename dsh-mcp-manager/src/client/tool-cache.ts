/**
 * Persistence for the most recent connection probe per server, so tool lists
 * survive page reloads and the tab can auto-fill cards without making the
 * user click 测试连接 every time. Live `ctx.tools` enumeration is
 * session-scoped on the platform, so this cache is the practical source of
 * "how many tools does this server expose".
 *
 * Storage is injectable for tests; JSON size is guarded by degrading the
 * payload (drop parameter schemas, then the tool list itself, keeping a
 * count) before giving up.
 */
import type { McpTestResponse } from '../contracts.ts'

export interface CachedTool {
  readonly name: string
  readonly description: string
  readonly inputSchema?: Readonly<Record<string, unknown>> | undefined
}

export interface CachedTest {
  readonly ok: boolean
  readonly durationMs: number
  readonly serverVersion?: string | undefined
  readonly error?: string | undefined
  readonly tools: readonly CachedTool[]
  /** Present when the tool list had to be dropped for size; tools is then empty. */
  readonly toolCount?: number | undefined
  readonly testedAt: number
}

const KEY_PREFIX = 'dsh-mcp-manager:test:'
const MAX_TOOLS = 200
const MAX_JSON_BYTES = 512 * 1024

export function loadCachedTest(storage: Storage, serverName: string): CachedTest | undefined {
  const raw = storage.getItem(KEY_PREFIX + serverName)
  if (raw === null) return undefined
  try {
    const parsed = JSON.parse(raw) as CachedTest
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.ok !== 'boolean') return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function saveCachedTest(storage: Storage, serverName: string, result: McpTestResponse): CachedTest | undefined {
  const cached = toCachedTest(result)
  for (const payload of degrade(cached)) {
    try {
      storage.setItem(KEY_PREFIX + serverName, JSON.stringify(payload))
      return payload
    } catch {
      // quota exceeded → try the next, smaller payload
    }
  }
  return undefined
}

export function clearCachedTest(storage: Storage, serverName: string): void {
  storage.removeItem(KEY_PREFIX + serverName)
}

function toCachedTest(result: McpTestResponse): CachedTest {
  const tools = (result.tools ?? []).slice(0, MAX_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema as Record<string, unknown> | undefined,
  }))
  return {
    ok: result.ok,
    durationMs: result.durationMs,
    serverVersion: result.serverVersion,
    error: result.error,
    tools: result.ok ? tools : [],
    toolCount: undefined,
    testedAt: Date.now(),
  }
}

/** Shrink step by step: full → without schemas → count only. */
function degrade(cached: CachedTest): CachedTest[] {
  const withoutSchemas: CachedTest = { ...cached, tools: cached.tools.map(tool => ({ name: tool.name, description: tool.description })) }
  const countOnly: CachedTest = { ...cached, tools: [], toolCount: cached.tools.length }
  return [cached, withoutSchemas, countOnly].filter(payload => {
    try {
      return JSON.stringify(payload).length <= MAX_JSON_BYTES
    } catch {
      return false
    }
  })
}
