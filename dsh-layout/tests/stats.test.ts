import { describe, expect, it } from 'vitest'
import type { SessionStatsProjection } from '@deepseek-ai/dsh-session-stats/client'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'
import { buildInlineStats, buildStatsView, cacheHitPercent, formatDuration, formatTokens } from '../src/client/stats.ts'
import type { LayoutLocaleKey } from '../src/client/locales.ts'
import { DEFAULT_METRICS, type StatsMetric } from '../src/client/types.ts'

const t = (key: LayoutLocaleKey): string => key

describe('statistics presentation', () => {
  it('builds a compact summary and detailed rows', () => {
    const stats: SessionStatsProjection = {
      turns: 1,
      steps: 77,
      llmMs: 520_000,
      toolMs: 96_000,
      ttftMs: 192_500,
      ttftSteps: 77,
      decodeMs: 10_000,
      decodeTokens: 830,
    }
    const usage: TokenUsageProjection = {
      uncachedInputTokens: 100_000,
      cacheReadTokens: 3_200_000,
      cacheWriteTokens: 0,
      outputTokens: 27_000,
    }

    const view = buildStatsView(stats, usage, t, DEFAULT_METRICS)

    expect(view.summary).toBe('77 stepUnit · 83 tok/s')
    expect(view.rows).toContainEqual({ label: 'cache', value: '97%' })
    expect(view.rows).toContainEqual({ label: 'tokens', value: 'input 3.3M · output 27K' })
    expect(buildInlineStats(view, t).map(group => group.text)).toEqual([
      '1 turnUnit · 77 stepUnit',
      'llmShort 8m40s · toolsShort 1m36s',
      'ttft 2.5s · 83 tok/s',
      'cache 97%',
      'input 3.3M · output 27K',
    ])
  })

  it('hides rows the metric filter turns off', () => {
    const stats: SessionStatsProjection = {
      turns: 1, steps: 7, llmMs: 1_000, toolMs: 1_000, ttftMs: 500, ttftSteps: 7, decodeMs: 1_000, decodeTokens: 100,
    }
    const metrics = { ...DEFAULT_METRICS, steps: false, speed: false, cache: false } as Record<StatsMetric, boolean>
    const view = buildStatsView(stats, undefined, t, metrics)
    expect(view.summary).toBe('')
    expect(view.rows.map(row => row.label)).not.toContain('steps')
    expect(view.rows.map(row => row.label)).not.toContain('speed')
  })

  it('handles empty usage without invalid percentages', () => {
    expect(cacheHitPercent({
      uncachedInputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 0,
    })).toBe(0)
  })

  it('uses stable compact formatting', () => {
    expect(formatTokens(517)).toBe('517')
    expect(formatTokens(12_200)).toBe('12.2K')
    expect(formatTokens(3_300_000)).toBe('3.3M')
    expect(formatDuration(2_500)).toBe('2.5s')
    expect(formatDuration(520_000)).toBe('8m40s')
  })
})
