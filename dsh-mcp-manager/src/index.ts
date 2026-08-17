/**
 * Host half of dsh-mcp-manager: projects MCP loader entries out of the
 * profile and home patch layers, aggregates live status (plugin inventory
 * fiber phase + tools registered on ctx.tools), performs add / edit / toggle
 * / delete writes with Cordis HMR applying them, and probes connections.
 */
import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-tools'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import {
  DSH_MCP_MANAGER_CHANNEL,
  type McpListResponse,
  type McpSaveRequest,
  type McpSaveResponse,
  type McpServerConfig,
  type McpServerView,
  type McpTestRequest,
  type McpTestResponse,
} from './contracts.ts'
import { containsJsExpr, PatchLayer, parseYamlConfig, dumpYamlConfig } from './patch-file.ts'
import {
  appendServer,
  collectMcpEntries,
  recordToServerConfig,
  removeServer,
  serverConfigToRecord,
  setServerDisabled,
  updateServer,
  validateServerConfig,
} from './server-config.ts'
import { testMcpConnection } from './test-connection.ts'

export const name = 'dsh-mcp-manager'

export const inject = ['connection', 'tools', 'loader', 'pluginInventory']

interface PatchPaths {
  profile: string | undefined
  home: string
  writing: string
}

interface LoadedLayers {
  readonly paths: PatchPaths
  readonly profile: PatchLayer | undefined
  readonly home: PatchLayer
}

async function loadLayers(ctx: Context): Promise<LoadedLayers> {
  const home = process.env.DSH_HOME !== undefined && process.env.DSH_HOME.trim() !== ''
    ? process.env.DSH_HOME
    : join(homedir(), '.dsh')
  const homeLayer = await PatchLayer.load(join(home, 'cordis.patch.yml'))
  // The profile directory is where the launcher boots from: try the Loader's
  // baseUrl, then the process working directory, and accept it only when its
  // manifest declares a dsh profile.
  const loaderBase = (ctx as unknown as { loader?: { config?: { baseUrl?: string } } }).loader?.config?.baseUrl
  let profileLayer: PatchLayer | undefined
  for (const base of [loaderBase, process.cwd()]) {
    if (profileLayer !== undefined) break
    if (base === undefined || base === '' || base === '/' || base === home) continue
    const manifest = await readFile(join(base, 'package.json'), 'utf8')
      .then(text => JSON.parse(text) as { dsh?: { profile?: { bundles?: unknown } } })
      .catch(() => undefined)
    if (manifest !== undefined && manifest.dsh?.profile !== undefined) {
      const candidate = await PatchLayer.load(join(base, 'cordis.patch.yml')).catch(() => undefined)
      if (candidate !== undefined) profileLayer = candidate
    }
  }
  const paths: PatchPaths = {
    profile: profileLayer?.path,
    home: homeLayer.path,
    writing: profileLayer?.path ?? homeLayer.path,
  }
  return { paths, profile: profileLayer, home: homeLayer }
}

interface InventoryEntryLike {
  readonly entryId: string
  readonly moduleName: string
  readonly enabled: boolean
  readonly fiberPhase: string | null
}

function inventoryOf(ctx: Context): readonly InventoryEntryLike[] {
  try {
    const gateway = (ctx as unknown as { pluginInventory?: { list?: () => { entries?: readonly InventoryEntryLike[] } } }).pluginInventory
    if (gateway === undefined || typeof gateway.list !== 'function') return []
    return gateway.list().entries ?? []
  } catch {
    return []
  }
}

interface ToolSchemaLike {
  readonly name: string
  readonly description: string
  readonly parameters: Record<string, unknown>
}

/**
 * Best-effort live tool projection. The ToolRuntime is session-scoped: on
 * compositions where the root-context service is not a usable instance this
 * returns nothing, and tool details fall back to the on-demand test probe.
 */
function toolsOf(ctx: Context): readonly ToolSchemaLike[] {
  try {
    const schemas = (ctx as unknown as { tools: { schemas?: () => readonly ToolSchemaLike[] } }).tools.schemas
    return schemas !== undefined ? schemas() : []
  } catch {
    return []
  }
}

function fiberFor(entries: readonly InventoryEntryLike[], entryId: string): string | null {
  const match = entries.find(entry => entry.entryId === entryId || entry.entryId.endsWith(`:${entryId}`))
  return match?.fiberPhase ?? null
}

function toolsForServer(tools: readonly ToolSchemaLike[], serverName: string): { publicName: string; description: string; parameters: Record<string, unknown> }[] {
  const prefix = `mcp__${serverName}__`
  return tools
    .filter(tool => tool.name.startsWith(prefix))
    .map(tool => ({ publicName: tool.name, description: tool.description, parameters: tool.parameters ?? {} }))
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.connection.rpc.handle(
    DSH_MCP_MANAGER_CHANNEL,
    (endpoint, payload) => handle(ctx, endpoint, payload),
    { authority: 'trusted-host' },
  ), 'dsh-mcp-manager: rpc')
}

type Endpoint = 'list' | 'save' | 'toggle' | 'delete' | 'test' | 'parseYaml' | 'dumpYaml'

async function handle(ctx: Context, endpoint: string, payload: unknown): Promise<RpcResult<unknown>> {
  try {
    switch (endpoint as Endpoint) {
      case 'list': return ok(await listServers(ctx))
      case 'save': return ok(await saveServer(ctx, payload as McpSaveRequest | null))
      case 'toggle': return ok(await toggleServer(ctx, payload as { entryId?: unknown; disabled?: unknown } | null))
      case 'delete': return ok(await deleteServer(ctx, payload as { entryId?: unknown } | null))
      case 'test': return ok(await testServer(payload as McpTestRequest | null))
      case 'parseYaml': return ok(parseYamlEndpoint(payload as { yaml?: unknown } | null))
      case 'dumpYaml': return ok(dumpYamlEndpoint(payload as { config?: unknown } | null))
      default: return badRequest(`未知操作：${endpoint}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return badRequest(message)
  }
}

async function listServers(ctx: Context): Promise<McpListResponse> {
  const loaded = await loadLayers(ctx)
  const layerInputs = [
    ...(loaded.profile !== undefined ? [{ layer: loaded.profile, origin: 'profile' as const }] : []),
    { layer: loaded.home, origin: 'home' as const },
  ]
  const records = collectMcpEntries(layerInputs)
  const inventory = inventoryOf(ctx)
  const tools = toolsOf(ctx)
  const servers: McpServerView[] = records.map(record => {
    const config = recordToServerConfig(record.config)
    return {
      serverName: config?.serverName ?? record.entryId.replace(/^mcp-/u, ''),
      entryId: record.entryId,
      origin: record.layer,
      disabled: record.disabled,
      removable: record.inserted,
      config,
      hasExpressions: containsJsExpr(record.config),
      fiberPhase: fiberFor(inventory, record.entryId),
      tools: config !== undefined && config.serverName !== '' ? toolsForServer(tools, config.serverName) : [],
    }
  })
  // Live-only servers: tools registered under a name no patch record owns.
  const known = new Set(servers.map(server => server.serverName))
  for (const tool of tools) {
    const match = /^mcp__([^_]+(?:_[^_]+)*?)__/.exec(tool.name)
    if (match === null) continue
    const candidate = match[1]
    if (candidate === undefined || known.has(candidate)) continue
    servers.push({
      serverName: candidate,
      entryId: `live:${candidate}`,
      origin: 'live',
      disabled: false,
      removable: false,
      config: undefined,
      hasExpressions: false,
      fiberPhase: null,
      tools: toolsForServer(tools, candidate),
    })
    known.add(candidate)
  }
  servers.sort((a, b) => a.serverName.localeCompare(b.serverName))
  return { servers, patchFiles: { profilePath: loaded.paths.profile ?? null, homePath: loaded.paths.home, writingPath: loaded.paths.writing } }
}

async function saveServer(ctx: Context, payload: McpSaveRequest | null): Promise<McpSaveResponse> {
  const config = payload?.config
  if (config === null || config === undefined) throw new Error('缺少服务器配置')
  validateServerConfig(config)
  const loaded = await loadLayers(ctx)
  const layerInputs = [
    ...(loaded.profile !== undefined ? [{ layer: loaded.profile, origin: 'profile' as const }] : []),
    { layer: loaded.home, origin: 'home' as const },
  ]
  const records = collectMcpEntries(layerInputs)
  const duplicate = records.find(record => {
    const name = recordToServerConfig(record.config)?.serverName
    return name === config.serverName && record.entryId !== payload?.entryId
  })
  if (duplicate !== undefined) throw new Error(`serverName "${config.serverName}" 已被条目 ${duplicate.entryId} 使用`)
  const writingLayer = loaded.profile ?? loaded.home
  if (payload?.entryId === undefined || payload.entryId === '') {
    const entryId = appendServer(writingLayer, config)
    await writingLayer.save()
    return { entryId, appliedVia: 'hmr' }
  }
  const record = records.find(candidate => candidate.entryId === payload.entryId)
  if (record === undefined) throw new Error(`未找到条目：${payload.entryId}`)
  updateServer(record, config)
  const touched = new Set<PatchLayer>([writingLayer])
  if (record.insertAt !== undefined) touched.add(record.insertAt.layer)
  for (const layer of record.overrideIndexes.keys()) touched.add(layer)
  for (const layer of touched) await layer.save()
  return { entryId: record.entryId, appliedVia: 'hmr' }
}

async function toggleServer(ctx: Context, payload: { entryId?: unknown; disabled?: unknown } | null): Promise<{ entryId: string; disabled: boolean }> {
  const entryId = typeof payload?.entryId === 'string' ? payload.entryId : ''
  if (entryId === '') throw new Error('缺少 entryId')
  const disabled = payload?.disabled === true
  const loaded = await loadLayers(ctx)
  const layerInputs = [
    ...(loaded.profile !== undefined ? [{ layer: loaded.profile, origin: 'profile' as const }] : []),
    { layer: loaded.home, origin: 'home' as const },
  ]
  const record = collectMcpEntries(layerInputs).find(candidate => candidate.entryId === entryId)
  if (record === undefined) throw new Error(`未找到条目：${entryId}`)
  setServerDisabled(record, disabled)
  const touched = new Set<PatchLayer>()
  if (record.insertAt !== undefined) touched.add(record.insertAt.layer)
  for (const layer of record.overrideIndexes.keys()) touched.add(layer)
  if (touched.size === 0) {
    // Foreign entry: append an id-target patch to the writing layer.
    ;(loaded.profile ?? loaded.home).patches.push({ id: entryId, name: '@deepseek-ai/dsh-mcp-client', ...(disabled ? { disabled: true } : { disabled: false }) })
    touched.add(loaded.profile ?? loaded.home)
  }
  for (const layer of touched) await layer.save()
  return { entryId, disabled }
}

async function deleteServer(ctx: Context, payload: { entryId?: unknown } | null): Promise<{ entryId: string }> {
  const entryId = typeof payload?.entryId === 'string' ? payload.entryId : ''
  if (entryId === '') throw new Error('缺少 entryId')
  const loaded = await loadLayers(ctx)
  const layerInputs = [
    ...(loaded.profile !== undefined ? [{ layer: loaded.profile, origin: 'profile' as const }] : []),
    { layer: loaded.home, origin: 'home' as const },
  ]
  const record = collectMcpEntries(layerInputs).find(candidate => candidate.entryId === entryId)
  if (record === undefined) throw new Error(`未找到条目：${entryId}`)
  removeServer(record)
  const touched = new Set<PatchLayer>()
  if (record.insertAt !== undefined) touched.add(record.insertAt.layer)
  for (const layer of record.overrideIndexes.keys()) touched.add(layer)
  for (const layer of touched) await layer.save()
  return { entryId }
}

async function testServer(payload: McpTestRequest | null): Promise<McpTestResponse> {
  const config = payload?.config
  if (config === null || config === undefined) throw new Error('缺少服务器配置')
  validateServerConfig(config)
  return testMcpConnection(config)
}

function parseYamlEndpoint(payload: { yaml?: unknown } | null): { config: McpServerConfig } {
  const text = typeof payload?.yaml === 'string' ? payload.yaml : ''
  if (text.trim() === '') throw new Error('YAML 为空')
  const raw = parseYamlConfig(text)
  const config = recordToServerConfig(raw)
  if (config === undefined) throw new Error('YAML 不是对象')
  validateServerConfig(config)
  return { config }
}

function dumpYamlEndpoint(payload: { config?: unknown } | null): { yaml: string } {
  const config = payload?.config as McpServerConfig | undefined
  if (config === null || config === undefined) throw new Error('缺少服务器配置')
  validateServerConfig(config)
  return { yaml: dumpYamlConfig(serverConfigToRecord(config)) }
}

function ok(value: unknown): RpcResult<unknown> { return { ok: true, value } }
function badRequest(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'bad-request', message, details: { issues: [] } } }
}
