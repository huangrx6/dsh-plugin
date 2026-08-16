import type { SessionStatsProjection } from '@deepseek-ai/dsh-session-stats/client'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'
import type { LayoutLocaleKey } from './locales.ts'
import type { StatsMetric } from './types.ts'

export interface StatRow {
  readonly label: StatsMetric
  readonly value: string
}

export interface StatsView {
  readonly summary: string
  readonly rows: readonly StatRow[]
}

export type MetricsFilter = Readonly<Record<StatsMetric, boolean>>

type Translate = (key: LayoutLocaleKey) => string

export interface InlineStatGroup {
  readonly key: string
  readonly text: string
}

export function buildStatsView(
  stats: SessionStatsProjection | undefined,
  usage: TokenUsageProjection | undefined,
  t: Translate,
  metrics: MetricsFilter,
): StatsView {
  const rows: StatRow[] = []
  if (stats !== undefined && stats.steps > 0) {
    if (metrics.turns) rows.push({ label: 'turns', value: `${stats.turns}` })
    if (metrics.steps) rows.push({ label: 'steps', value: `${stats.steps}` })
    if (metrics.llm && stats.llmMs > 0) rows.push({ label: 'llm', value: formatDuration(stats.llmMs) })
    if (metrics.tools && stats.toolMs > 0) rows.push({ label: 'tools', value: formatDuration(stats.toolMs) })
    if (metrics.ttft && stats.ttftSteps > 0) rows.push({ label: 'ttft', value: formatDuration(stats.ttftMs / stats.ttftSteps) })
    if (metrics.speed && stats.decodeMs > 0) rows.push({ label: 'speed', value: `${formatRate(stats.decodeTokens / (stats.decodeMs / 1000))} tok/s` })
  }
  if (usage !== undefined) {
    const input = billedInputTokens(usage)
    if (metrics.cache && input > 0) rows.push({ label: 'cache', value: `${cacheHitPercent(usage)}%` })
    if (metrics.tokens && (input > 0 || usage.outputTokens > 0)) {
      rows.push({ label: 'tokens', value: `${t('input')} ${formatTokens(input)} · ${t('output')} ${formatTokens(usage.outputTokens)}` })
    }
  }
  const summaryParts: string[] = []
  if (metrics.steps && stats !== undefined && stats.steps > 0) summaryParts.push(`${stats.steps} ${t('stepUnit')}`)
  if (metrics.speed && stats !== undefined && stats.decodeMs > 0) summaryParts.push(`${formatRate(stats.decodeTokens / (stats.decodeMs / 1000))} tok/s`)
  return { summary: summaryParts.join(' · '), rows }
}

/** Recreates the original, complete one-line session readout in logical groups. */
export function buildInlineStats(view: StatsView, t: Translate): readonly InlineStatGroup[] {
  const value = (label: LayoutLocaleKey): string | undefined => view.rows.find(row => row.label === label)?.value
  const compact = (parts: readonly (string | undefined)[]): string | undefined => {
    const present = parts.filter((part): part is string => part !== undefined)
    return present.length === 0 ? undefined : present.join(' · ')
  }
  const turns = value('turns')
  const steps = value('steps')
  const llm = value('llm')
  const tools = value('tools')
  const ttft = value('ttft')
  const speed = value('speed')
  const cache = value('cache')
  const tokens = value('tokens')
  const groups = [
    { key: 'progress', text: compact([turns === undefined ? undefined : withUnit(turns, t('turnUnit')), steps === undefined ? undefined : withUnit(steps, t('stepUnit'))]) },
    { key: 'time', text: compact([llm === undefined ? undefined : `${t('llmShort')} ${llm}`, tools === undefined ? undefined : `${t('toolsShort')} ${tools}`]) },
    { key: 'generation', text: compact([ttft === undefined ? undefined : `${t('ttft')} ${ttft}`, speed]) },
    { key: 'cache', text: cache === undefined ? undefined : `${t('cache')} ${cache}` },
    { key: 'tokens', text: tokens },
  ]
  return groups.filter((group): group is InlineStatGroup => group.text !== undefined)
}

function withUnit(value: string, unit: string): string {
  return /^[a-z]/iu.test(unit) ? `${value} ${unit}` : `${value}${unit}`
}

export function billedInputTokens(usage: TokenUsageProjection): number {
  return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
}

export function cacheHitPercent(usage: TokenUsageProjection): number {
  const input = billedInputTokens(usage)
  return input === 0 ? 0 : Math.round(usage.cacheReadTokens / input * 100)
}

export function formatTokens(value: number): string {
  if (value < 1000) return String(Math.round(value))
  if (value < 1_000_000) return `${compact(value / 1000)}K`
  return `${compact(value / 1_000_000)}M`
}

export function formatDuration(milliseconds: number): string {
  const seconds = milliseconds / 1000
  if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}m${whole % 60}s`
}

export function formatRate(value: number): string {
  const clamped = Math.max(0, value)
  return clamped >= 10 ? String(Math.round(clamped)) : String(Math.round(clamped * 10) / 10)
}

function compact(value: number): string {
  return value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)
}
