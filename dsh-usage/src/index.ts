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
import '@deepseek-ai/dsh-client-connection'
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
  readonly detail?: string
}): UsageBar {
  const out: UsageBar = { label: partial.label }
  if (partial.remainingPercent !== undefined) out.remainingPercent = partial.remainingPercent
  if (partial.remaining !== undefined) out.remaining = partial.remaining
  if (partial.total !== undefined) out.total = partial.total
  if (partial.unit !== undefined) out.unit = partial.unit
  if (partial.detail !== undefined) out.detail = partial.detail
  return out
}

/** Format a duration in ms as a compact human string. */
function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  if (ms >= 48 * 3_600_000) return `${(ms / 86_400_000).toFixed(1)} 天`
  if (ms >= 3_600_000) return `${(ms / 3_600_000).toFixed(1)} 小时`
  return `${Math.round(ms / 60_000)} 分钟`
}

/** Format a reset timestamp as "MM-dd HH:mm" in the host's local time. */
function formatReset(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Label a TOKENS_LIMIT window from its reset distance: ≤10 days reads as
    每周, longer windows as 每月 (current GLM plans ship one of each). */
function glmWindowLabel(nextResetTime: number | undefined): string {
  if (nextResetTime === undefined) return '额度'
  const days = (nextResetTime - Date.now()) / 86_400_000
  return days <= 10 ? '每周' : '每月'
}

/** GLM Coding Plan quota — GET /api/monitor/usage/quota/limit.
 *
 * data.limits[] carries ONE TIME_LIMIT (rolling 5h window: usage /
 * currentValue / remaining counts + percentage used) and ONE OR MORE
 * TOKENS_LIMIT entries (one per token-pool window — weekly AND monthly on
 * current plans; each has percentage used + nextResetTime). Percentage is
 * always "used", so remaining = 100 - percentage.
 */
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
    data?: {
      limits?: Array<{
        type?: string
        percentage?: number
        currentValue?: number
        remaining?: number
        usage?: number
        nextResetTime?: number
      }>
      level?: string
    }
  }
  const limits = json.data?.limits ?? []
  const bars: UsageBar[] = []
  for (const limit of limits) {
    if (limit.type === 'TOKENS_LIMIT') {
      const b = bar({
        label: glmWindowLabel(limit.nextResetTime),
        remainingPercent: Math.max(0, 100 - (limit.percentage ?? 0)),
      })
      if (limit.nextResetTime !== undefined) b.detail = `重置于 ${formatReset(limit.nextResetTime)}`
      bars.push(b)
    }
  }
  const time = limits.find((l) => l.type === 'TIME_LIMIT')
  if (time !== undefined) {
    const b = bar({
      label: '5 小时',
      remainingPercent: Math.max(0, 100 - (time.percentage ?? 0)),
      remaining: time.remaining,
      total: time.usage !== undefined && time.remaining !== undefined ? time.usage + time.remaining : undefined,
      unit: time.usage !== undefined ? '次' : undefined,
    })
    if (time.remaining !== undefined && time.usage !== undefined) {
      b.detail = `剩余 ${time.remaining} / ${time.usage + time.remaining} 次`
    }
    if (time.nextResetTime !== undefined && b.detail === undefined) {
      b.detail = `重置于 ${formatReset(time.nextResetTime)}`
    } else if (time.nextResetTime !== undefined) {
      b.detail += ` · ${formatReset(time.nextResetTime)}`
    }
    bars.unshift(b)
  }
  const out: UsageQueryResult = { id: entry.id, label: entry.label, ok: true, bars }
  if (json.data?.level !== undefined) out.level = json.data.level
  return out
}

/**
 * MiniMax Token Plan usage — GET /v1/token_plan/remains.
 *
 * Response shape (unlike GLM, no data.limits[]): model_remains[] buckets,
 * one per plan quota. The shared chat quota is model_name 'general'; each
 * bucket carries a rolling 5h window (current_interval_*) and a weekly
 * window (current_weekly_*). MiniMax answers HTTP 200 even for rejected
 * credentials, so base_resp.status_code is the real success signal.
 */
async function queryMinimax(entry: UsageEntry): Promise<UsageQueryResult> {
  const key = resolveSecret(entry.apiKey)?.trim()
  const endpoint = entry.endpoint?.trim() || 'https://www.minimaxi.com/v1/token_plan/remains'
  if (key === undefined || key === '') {
    return { id: entry.id, label: entry.label, ok: false, message: '未配置 API key' }
  }
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    return { id: entry.id, label: entry.label, ok: false, message: `HTTP ${response.status}` }
  }
  const json = (await response.json()) as {
    model_remains?: Array<{
      model_name?: string
      remains_time?: number
      weekly_remains_time?: number
      current_interval_total_count?: number
      current_interval_usage_count?: number
      current_interval_remaining_percent?: number
      current_interval_status?: number
      current_weekly_total_count?: number
      current_weekly_usage_count?: number
      current_weekly_remaining_percent?: number
      current_weekly_status?: number
      end_time?: number
      weekly_end_time?: number
    }>
    base_resp?: { status_code?: number; status_msg?: string }
  }
  if (json.base_resp?.status_code !== 0) {
    return { id: entry.id, label: entry.label, ok: false, message: json.base_resp?.status_msg || '接口返回错误' }
  }
  const buckets = json.model_remains ?? []
  // Every bucket becomes its own bar pair: 'general' is the shared chat
  // quota (unprefixed), other buckets (video, …) get their name prefixed.
  const bars: UsageBar[] = []
  for (const bucket of buckets) {
    const prefix = bucket.model_name === 'general' || bucket.model_name === undefined ? '' : `${bucket.model_name} · `
    if (bucket.current_interval_remaining_percent !== undefined) {
      const b = bar({ label: `${prefix}5 小时`, remainingPercent: bucket.current_interval_remaining_percent })
      if (bucket.remains_time !== undefined) b.detail = `剩余 ${formatDuration(bucket.remains_time)}`
      bars.push(b)
    }
    if (bucket.current_weekly_remaining_percent !== undefined) {
      const b = bar({ label: `${prefix}每周`, remainingPercent: bucket.current_weekly_remaining_percent })
      if (bucket.weekly_remains_time !== undefined) b.detail = `剩余 ${formatDuration(bucket.weekly_remains_time)}`
      bars.push(b)
    }
  }
  if (bars.length === 0) {
    return { id: entry.id, label: entry.label, ok: false, message: '响应中无用量数据' }
  }
  return { id: entry.id, label: entry.label, ok: true, bars }
}

/**
 * OpenCode Go quota — official JSON API (per cc-switch issue #6433):
 *   GET https://opencode.ai/zen/go/v1/usage
 *   Authorization: Bearer <Anthropic-compatible API key>
 * usage.rolling = 5h / weekly / monthly, each { percent, resetsAt }.
 */
async function queryOpencode(entry: UsageEntry): Promise<UsageQueryResult> {
  const token = resolveSecret(entry.apiKey)?.trim()
  const endpoint = entry.endpoint?.trim() || 'https://opencode.ai/zen/go/v1/usage'
  if (token === undefined || token === '') {
    return { id: entry.id, label: entry.label, ok: false, message: '未配置 API key（可用 env:OPENCODE_API_KEY）' }
  }
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'dsh-usage/1.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    return { id: entry.id, label: entry.label, ok: false, message: `HTTP ${response.status}` }
  }
  const json = (await response.json()) as {
    usage?: { rolling?: { percent?: number; status?: string }; weekly?: { percent?: number; status?: string }; monthly?: { percent?: number; status?: string } }
  }
  const usage = json.usage ?? {}
  const bars: UsageBar[] = []
  const windows: Array<[keyof typeof usage, string]> = [
    ['rolling', '5 小时'],
    ['weekly', '每周'],
    ['monthly', '每月'],
  ]
  for (const [key, label] of windows) {
    const window = usage[key]
    const percent = window?.percent
    if (window === undefined || typeof percent !== 'number') continue
    bars.push(bar({ label, remainingPercent: Math.max(0, 100 - percent) }))
  }
  if (bars.length === 0) {
    return { id: entry.id, label: entry.label, ok: false, message: '响应中无 usage 字段' }
  }
  return { id: entry.id, label: entry.label, ok: true, bars }
}

async function runQuery(entries: readonly UsageEntry[]): Promise<UsageQueryResult[]> {
  const results: UsageQueryResult[] = []
  for (const entry of entries) {
    let outcome: UsageQueryResult
    try {
      if (entry.provider === 'glm') outcome = await queryGlm(entry)
      else if (entry.provider === 'minimax') outcome = await queryMinimax(entry)
      else outcome = await queryOpencode(entry)
    } catch (error) {
      outcome = { id: entry.id, label: entry.label, ok: false, message: error instanceof Error ? error.message : String(error) }
    }
    results.push(outcome)
  }
  return results
}

export function apply(ctx: { connection: { rpc: { handle: (channel: string, handler: ConnectionRpcHandler, options: { authority: 'trusted-host' | 'loopback' }) => Promise<unknown> } }; effect: (fn: () => unknown, label?: string) => void }): void {
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

  ctx.effect(
    () => ctx.connection.rpc.handle(DSH_USAGE_CHANNEL, handler, { authority: 'trusted-host' }),
    'dsh-usage: rpc',
  )
}
