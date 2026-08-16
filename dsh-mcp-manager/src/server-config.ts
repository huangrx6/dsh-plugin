/**
 * MCP server records projected from the patch layers, plus validation and
 * the edit operations the manager performs on them. Patch semantics mirror
 * `applyEntryPatches`: patches apply in order; later patches may target an
 * entry an earlier patch inserted by id; a `config` override replaces the
 * whole config object.
 */
import type { McpJsExprValue, McpServerConfig, McpTransport } from './contracts.ts'
import { MCP_MODULE } from './contracts.ts'
import { isJsExpr, type PatchLayer } from './patch-file.ts'

export const SERVER_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/

/** One MCP loader entry across the composed patch layers. */
export interface McpEntryRecord {
  readonly entryId: string
  /** Layer of the insert entry (or of the override for foreign entries). */
  readonly layer: 'profile' | 'home'
  /** The entry was inserted by a patch in a writable layer. */
  readonly inserted: boolean
  /** Effective config: insert config overridden by any id-target patches. */
  config: Record<string, unknown> | undefined
  disabled: boolean
  /** Insert location, when `inserted`. */
  insertAt: { layer: PatchLayer; patchIndex: number; entryIndex: number } | undefined
  /** Indexes of id-target patches touching this entry, per layer. */
  readonly overrideIndexes: Map<PatchLayer, number[]>
}

interface PatchShape {
  id?: unknown
  name?: unknown
  insert?: unknown
  config?: unknown
  disabled?: unknown
}

function asPatch(value: unknown): PatchShape | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  return value as PatchShape
}

function looksLikeMcpEntry(entry: Record<string, unknown>): boolean {
  if (entry['name'] === MCP_MODULE) return true
  const config = entry['config']
  if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
    const record = config as Record<string, unknown>
    if (typeof record['serverName'] === 'string' && (record['transport'] === 'stdio' || record['transport'] === 'streamable-http')) return true
  }
  return false
}

/**
 * Project MCP entries out of the patch layers. `layers` must be given in
 * composition order (profile first, home second) — later layers win.
 */
export interface LayerInput {
  readonly layer: PatchLayer
  readonly origin: 'profile' | 'home'
}

export function collectMcpEntries(layers: readonly LayerInput[]): McpEntryRecord[] {
  const byId = new Map<string, McpEntryRecord>()
  const order: McpEntryRecord[] = []
  for (const { layer, origin } of layers) {
    for (let patchIndex = 0; patchIndex < layer.patches.length; patchIndex += 1) {
      const patch = asPatch(layer.patches[patchIndex])
      if (patch === undefined) continue
      if (Array.isArray(patch.insert)) {
        for (let entryIndex = 0; entryIndex < patch.insert.length; entryIndex += 1) {
          const entry = patch.insert[entryIndex]
          if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
          const record = entry as Record<string, unknown>
          if (!looksLikeMcpEntry(record)) continue
          const entryId = typeof record['id'] === 'string' && record['id'] !== '' ? record['id'] : `mcp-unnamed-${patchIndex}-${entryIndex}`
          const config = typeof record['config'] === 'object' && record['config'] !== null && !Array.isArray(record['config'])
            ? structuredClone(record['config']) as Record<string, unknown>
            : {}
          const created: McpEntryRecord = {
            entryId,
            layer: origin,
            inserted: true,
            config,
            disabled: record['disabled'] === true,
            insertAt: { layer, patchIndex, entryIndex },
            overrideIndexes: new Map(),
          }
          order.push(created)
          byId.set(entryId, created)
        }
        continue
      }
      if (typeof patch.id !== 'string' || patch.id === '') continue
      const existing = byId.get(patch.id)
      const isMcpPatch = patch.name === MCP_MODULE
        || (patch.config !== undefined && typeof patch.config === 'object' && looksLikeMcpEntry(patch.config as Record<string, unknown>))
        || patch.id.startsWith('mcp-')
      if (existing !== undefined) {
        if ('config' in patch && patch.config !== undefined && typeof patch.config === 'object' && !Array.isArray(patch.config)) {
          existing.config = structuredClone(patch.config) as Record<string, unknown>
        }
        if ('disabled' in patch) existing.disabled = patch.disabled === true
        const indexes = existing.overrideIndexes.get(layer) ?? []
        indexes.push(patchIndex)
        existing.overrideIndexes.set(layer, indexes)
        continue
      }
      if (!isMcpPatch) continue
      if (patch.config === undefined && patch.disabled === undefined) continue
      const created: McpEntryRecord = {
        entryId: patch.id,
        layer: origin,
        inserted: false,
        config: patch.config !== undefined && typeof patch.config === 'object' && patch.config !== null && !Array.isArray(patch.config)
          ? structuredClone(patch.config) as Record<string, unknown>
          : undefined,
        disabled: patch.disabled === true,
        insertAt: undefined,
        overrideIndexes: new Map([[layer, [patchIndex]]]),
      }
      order.push(created)
      byId.set(patch.id, created)
    }
  }
  return order
}

/** Validate an editor draft config; throws with a readable message. */
export function validateServerConfig(config: McpServerConfig): void {
  if (typeof config.serverName !== 'string' || !SERVER_NAME_PATTERN.test(config.serverName)) {
    throw new Error('服务器名必须匹配 /^[A-Za-z0-9_-]{1,32}$/（1–32 个字母、数字、下划线或连字符）')
  }
  if (config.transport !== 'stdio' && config.transport !== 'streamable-http') throw new Error('传输方式必须是 stdio 或 streamable-http')
  if (config.transport === 'stdio') {
    if (typeof config.command !== 'string' || config.command.trim() === '') throw new Error('stdio 传输需要 command')
  } else {
    if (typeof config.url !== 'string' || config.url.trim() === '') throw new Error('streamable-http 传输需要 url')
    try {
      new URL(config.url)
    } catch {
      throw new Error('url 不是合法地址')
    }
  }
  if (config.args !== undefined) {
    if (!Array.isArray(config.args) || config.args.some(arg => typeof arg !== 'string')) throw new Error('args 必须是字符串数组')
  }
  for (const field of ['env', 'headers'] as const) {
    const value = config[field]
    if (value === undefined) continue
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${field} 必须是键值对`)
    for (const [key, entry] of Object.entries(value)) {
      if (key.trim() === '') throw new Error(`${field} 的键不能为空`)
      if (typeof entry !== 'string' && !isJsExpr(entry)) throw new Error(`${field}[${key}] 必须是字符串或 !!js 表达式`)
    }
  }
  if (config.toolCallTimeoutMs !== undefined) {
    if (typeof config.toolCallTimeoutMs !== 'number' || !Number.isFinite(config.toolCallTimeoutMs) || config.toolCallTimeoutMs <= 0) throw new Error('toolCallTimeoutMs 必须是正数')
  }
  if (config.reconnect !== undefined) {
    const reconnect = config.reconnect
    if (typeof reconnect !== 'object' || reconnect === null) throw new Error('reconnect 必须是对象')
    for (const key of ['initialDelayMs', 'maxDelayMs', 'maxAttempts'] as const) {
      const value = reconnect[key]
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) throw new Error(`reconnect.${key} 必须是非负数`)
    }
  }
}

/** Append an insert patch for a new server to the writing layer. */
export function appendServer(layer: PatchLayer, config: McpServerConfig): string {
  const entryId = `mcp-${config.serverName}`
  layer.patches.push({ insert: [{ id: entryId, name: MCP_MODULE, config: serverConfigToRecord(config) }] })
  return entryId
}

/** Update an existing record's config across its insert / override patches. */
export function updateServer(record: McpEntryRecord, config: McpServerConfig): void {
  const next = serverConfigToRecord(config)
  if (record.inserted && record.insertAt !== undefined) {
    const { layer, patchIndex, entryIndex } = record.insertAt
    const patch = asPatch(layer.patches[patchIndex])
    const insert = patch !== undefined && Array.isArray(patch.insert) ? patch.insert : undefined
    const entry = insert?.[entryIndex]
    if (entry === undefined || typeof entry !== 'object' || entry === null) throw new Error('找不到原始插入条目')
    ;(entry as Record<string, unknown>)['config'] = next
  }
  // Keep any id-target override patches consistent with the new config.
  for (const [layer, indexes] of record.overrideIndexes) {
    for (const patchIndex of indexes) {
      const patch = asPatch(layer.patches[patchIndex])
      if (patch === undefined) continue
      if ('config' in patch && patch.config !== undefined) patch.config = structuredClone(next)
    }
  }
}

/** Flip `disabled` on the insert entry and any id-target overrides. */
export function setServerDisabled(record: McpEntryRecord, disabled: boolean): void {
  const apply = (holder: Record<string, unknown>): void => {
    if (disabled) holder['disabled'] = true
    else delete holder['disabled']
  }
  if (record.inserted && record.insertAt !== undefined) {
    const { layer, patchIndex, entryIndex } = record.insertAt
    const patch = asPatch(layer.patches[patchIndex])
    const entry = patch !== undefined && Array.isArray(patch.insert) ? patch.insert[entryIndex] : undefined
    if (entry !== undefined && typeof entry === 'object' && entry !== null) apply(entry as Record<string, unknown>)
  }
  for (const [layer, indexes] of record.overrideIndexes) {
    for (const patchIndex of indexes) {
      const patch = asPatch(layer.patches[patchIndex])
      if (patch === undefined) continue
      if ('disabled' in patch || disabled) apply(patch as Record<string, unknown>)
    }
  }
}

/** Remove a record's insert entry and every override patch targeting it. */
export function removeServer(record: McpEntryRecord): void {
  if (!record.inserted) throw new Error('该条目不由补丁层插入，无法删除；只能停用')
  // Override patches first: their recorded indexes shift once the insert
  // patch itself is spliced out, so remove them while the indexes still hold.
  for (const [layer, indexes] of record.overrideIndexes) {
    for (const patchIndex of [...indexes].sort((a, b) => b - a)) {
      layer.patches.splice(patchIndex, 1)
    }
  }
  if (record.insertAt !== undefined) {
    const { layer, patchIndex, entryIndex } = record.insertAt
    const patch = asPatch(layer.patches[patchIndex])
    if (patch === undefined || !Array.isArray(patch.insert)) throw new Error('找不到原始插入条目')
    patch.insert.splice(entryIndex, 1)
    if (patch.insert.length === 0) layer.patches.splice(patchIndex, 1)
  }
}

/** Drop undefined optionals so the YAML stays minimal. */
export function serverConfigToRecord(config: McpServerConfig): Record<string, unknown> {
  const out: Record<string, unknown> = { serverName: config.serverName, transport: config.transport }
  if (config.command !== undefined && config.command !== '') out['command'] = config.command
  if (config.args !== undefined && config.args.length > 0) out['args'] = [...config.args]
  if (config.env !== undefined && Object.keys(config.env).length > 0) out['env'] = config.env
  if (config.cwd !== undefined && config.cwd !== '') out['cwd'] = config.cwd
  if (config.url !== undefined && config.url !== '') out['url'] = config.url
  if (config.headers !== undefined && Object.keys(config.headers).length > 0) out['headers'] = config.headers
  if (config.toolCallTimeoutMs !== undefined) out['toolCallTimeoutMs'] = config.toolCallTimeoutMs
  if (config.failOnStartupError === true) out['failOnStartupError'] = true
  if (config.reconnect !== undefined && Object.keys(config.reconnect).length > 0) out['reconnect'] = config.reconnect
  return out
}

/** Best-effort cast of a raw patch config record into the editor shape. */
export function recordToServerConfig(record: Record<string, unknown> | undefined): McpServerConfig | undefined {
  if (record === undefined) return undefined
  const transport = record['transport'] === 'streamable-http' ? 'streamable-http' : 'stdio'
  const args = Array.isArray(record['args']) ? record['args'].filter((arg): arg is string => typeof arg === 'string') : undefined
  const stringMap = (value: unknown): Record<string, string | McpJsExprValue> | undefined => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
    const out: Record<string, string | McpJsExprValue> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (typeof entry === 'string') out[key] = entry
      else if (isJsExpr(entry)) out[key] = { __jsExpr: entry.__jsExpr }
    }
    return out
  }
  const reconnectRaw = record['reconnect']
  const reconnect = typeof reconnectRaw === 'object' && reconnectRaw !== null && !Array.isArray(reconnectRaw)
    ? reconnectRaw as Partial<{ enabled: boolean; initialDelayMs: number; maxDelayMs: number; maxAttempts: number }>
    : undefined
  return {
    serverName: typeof record['serverName'] === 'string' ? record['serverName'] : '',
    transport: transport as McpTransport,
    command: typeof record['command'] === 'string' ? record['command'] : undefined,
    args,
    env: stringMap(record['env']),
    cwd: typeof record['cwd'] === 'string' ? record['cwd'] : undefined,
    url: typeof record['url'] === 'string' ? record['url'] : undefined,
    headers: stringMap(record['headers']),
    toolCallTimeoutMs: typeof record['toolCallTimeoutMs'] === 'number' ? record['toolCallTimeoutMs'] : undefined,
    failOnStartupError: record['failOnStartupError'] === true ? true : undefined,
    reconnect: reconnect !== undefined && Object.keys(reconnect).length > 0 ? reconnect : undefined,
  }
}
