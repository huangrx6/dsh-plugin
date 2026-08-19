/**
 * Host half of dsh-usage.
 *
 * One trusted-host RPC channel that (1) reads/writes a local config of
 * subscription entries at `$DSH_HOME/dsh-usage.json` (0600, never in the
 * browser) and (2) performs the outbound quota queries server-side so API
 * keys never leave the host.
 *
 * Adapters:
 *  - glm: GET <endpoint>/api/monitor/usage/quota/limit with
 *    `Authorization: <token>` → limits[]: TIME_LIMIT = 5h, TOKENS_LIMIT = weekly.
 *  - minimax: GET the configured endpoint (Token Plan usage API) with
 *    `Authorization: Bearer <key>` → parsed into bars from limits[].
 *  - opencode: no public API → manual percent the user fills in.
 */
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises'
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import {
  DSH_USAGE_CHANNEL,
  type UsagePayload,
  type UsageConfig,
  type UsageEntry,
  type UsageBar,
  type UsageQueryResult,
} from './contracts.ts'

export const name = 'dsh-usage'
export const inject = ['connection']

function configPath(): string {
  const home = process.env['DSH_HOME'] ?? join(homedir(), '.dsh')
  return join(home, 'dsh-usage.json')
}

/** Resolve a stored credential: `env:NAME` reads the local environment
    variable at query time (never persisted); anything else is the literal
    value the user typed. */
function resolveSecret(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  if (!trimmed.startsWith('env:')) return trimmed
  const name = trimmed.slice('env:'.length).trim()
  return process.env[name]
}

function ok(value: unknown): RpcResult<unknown> {
  return { ok: true, value }
}
function fail(error: unknown): RpcResult<unknown> {
  return {
    ok: false,
    error: {
      code: 'internal',
      message: error instanceof Error ? error.message : String(error),
      details: {},
    },
  }
}

async function readConfig(): Promise<UsageConfig> {
  try {
    const raw = await readFile(configPath(), 'utf8')
    const parsed = JSON.parse(raw) as { entries?: unknown }
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : []
    return { entries: entries.filter(isEntry) }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { entries: [] }
    throw error
  }
}

function isEntry(value: unknown): value is UsageEntry {
  if (value === null || typeof value !== 'object') return false
  const e = value as { id?: unknown; provider?: unknown; label?: unknown }
  return (
    typeof e.id === 'string' && typeof e.provider === 'string' && typeof e.label === 'string'
  )
}

async function writeConfig(config: UsageConfig): Promise<void> {
  const file = configPath()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 })
  await chmod(file, 0o600).catch(() => {})
}

/** Build a bar, only keeping fields that are actually present
    (exactOptionalPropertyTypes forbids explicit undefined). */
function bar(partial: {
  readonly label: string
  readonly remainingPercent?: number
  readonly remaining?: number
  readonly total?: number
  readonly unit?: string
}): UsageBar {
  const out: UsageBar = { label: partial.label }
  if (partial.remainingPercent !== undefined) out.remainingPercent = partial.remainingPercent
  if (partial.remaining !== undefined) out.remaining = partial.remaining
  if (partial.total !== undefined) out.total = partial.total
  if (partial.unit !== undefined) out.unit = partial.unit
  return out
}

/** GLM Coding Plan quota: 5h + weekly bars. */
async function queryGlm(entry: UsageEntry): Promise<UsageQueryResult> {
  const token = resolveSecret(entry.apiKey)?.trim()
  const endpoint =
    entry.endpoint?.trim() ||
    (entry.region === 'zai'
      ? 'https://api.z.ai/api/monitor/usage/quota/limit'
      : 'https://open.bigmodel.cn/api/monitor/usage/quota/limit')
  if (token === undefined || token === '') {
    return { id: entry.id, label: entry.label, ok: false, message: '未配置 API token' }
  }
  const response = await fetch(endpoint, {
    headers: { Authorization: token },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    return { id: entry.id, label: entry.label, ok: false, message: `HTTP ${response.status}` }
  }
  const json = (await response.json()) as {
    data?: { limits?: Array<{ type?: string; percentage?: number; currentValue?: number; remaining?: number; usage?: number }>; level?: string }
  }
  const limits = json.data?.limits ?? []
  const byType = (t: string) => limits.find((l) => l.type === t)
  const time = byType('TIME_LIMIT')
  const tokens = byType('TOKENS_LIMIT')
  const bars: UsageBar[] = []
  if (time !== undefined) {
    bars.push(bar({
      label: '5 小时',
      remainingPercent: Math.max(0, 100 - (time.percentage ?? 0)),
      remaining: time.remaining,
      total: time.currentValue !== undefined && time.remaining !== undefined ? time.currentValue + time.remaining : undefined,
      unit: time.usage !== undefined ? '次' : undefined,
    }))
  }
  if (tokens !== undefined) {
    bars.push(bar({
      label: '每周',
      remainingPercent: Math.max(0, 100 - (tokens.percentage ?? 0)),
      remaining: tokens.remaining,
      total: tokens.currentValue !== undefined && tokens.remaining !== undefined ? tokens.currentValue + tokens.remaining : undefined,
    }))
  }
  const out: UsageQueryResult = { id: entry.id, label: entry.label, ok: true, bars }
  if (json.data?.level !== undefined) out.level = json.data.level
  return out
}

/** MiniMax Token Plan usage: one unified usage bar from a configurable endpoint. */
async function queryMinimax(entry: UsageEntry): Promise<UsageQueryResult> {
  const key = resolveSecret(entry.apiKey)?.trim()
  const endpoint = entry.endpoint?.trim() ?? ''
  if (key === undefined || key === '') {
    return { id: entry.id, label: entry.label, ok: false, message: '未配置 API key' }
  }
  if (endpoint === '') {
    return { id: entry.id, label: entry.label, ok: false, message: 'MiniMax 用量端点未配置（官方文档未公开此 URL，请在面板里填写）' }
  }
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    return { id: entry.id, label: entry.label, ok: false, message: `HTTP ${response.status}` }
  }
  const json = (await response.json()) as {
    data?: { limits?: Array<{ type?: string; percentage?: number; currentValue?: number; remaining?: number }> }
  }
  const limits = json.data?.limits ?? []
  const first = limits[0]
  if (first === undefined) {
    return { id: entry.id, label: entry.label, ok: false, message: '响应中无 limits' }
  }
  return {
    id: entry.id,
    label: entry.label,
    ok: true,
    bars: [bar({
      label: '套餐用量',
      remainingPercent: Math.max(0, 100 - (first.percentage ?? 0)),
      remaining: first.remaining,
      total: first.currentValue !== undefined && first.remaining !== undefined ? first.currentValue + first.remaining : undefined,
    })],
  }
}

async function runQuery(entries: readonly UsageEntry[]): Promise<UsageQueryResult[]> {
  const results: UsageQueryResult[] = []
  for (const entry of entries) {
    let outcome: UsageQueryResult
    try {
      if (entry.provider === 'glm') outcome = await queryGlm(entry)
      else if (entry.provider === 'minimax') outcome = await queryMinimax(entry)
      else {
        outcome = { id: entry.id, label: entry.label, ok: true, bars: [] }
        const manual = resolveSecret(entry.apiKey) === undefined ? undefined : Number(resolveSecret(entry.apiKey)!.trim())
        if (manual !== undefined && Number.isFinite(manual)) outcome.manualPercent = manual
      }
    } catch (error) {
      outcome = { id: entry.id, label: entry.label, ok: false, message: error instanceof Error ? error.message : String(error) }
    }
    results.push(outcome)
  }
  return results
}

export function apply(ctx: unknown): void {
  const ext = ctx as {
    effect?: (fn: () => () => void, label?: string) => void
    connection: {
      rpc: {
        handle: (channel: string, handler: ConnectionRpcHandler, options: { authority: 'trusted-host' | 'loopback' }) => Promise<unknown>
      }
    }
  }

  const handler: ConnectionRpcHandler = async (_endpoint, payload) => {
    const request = payload as UsagePayload
    try {
      if (request?.op === 'config.read') {
        return ok(await readConfig())
      }
      if (request?.op === 'config.write') {
        const config = request.payload?.config
        if (config === undefined || !Array.isArray(config.entries)) {
          return fail(new Error('config.entries 必需'))
        }
        await writeConfig(config)
        return ok({ saved: true })
      }
      if (request?.op === 'query') {
        const config = await readConfig()
        return ok({ results: await runQuery(config.entries) })
      }
      return fail(new Error(`unknown op: ${String(request?.op)}`))
    } catch (error) {
      return fail(error)
    }
  }

  ext.effect?.(
    () => {
      const handlePromise = ext.connection.rpc.handle(DSH_USAGE_CHANNEL, handler, { authority: 'trusted-host' })
      return () => {
        void handlePromise
      }
    },
    'dsh-usage: rpc',
  )
}
