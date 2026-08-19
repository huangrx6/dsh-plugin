/** Wire contract for the subscription usage monitor. */
export const DSH_USAGE_CHANNEL = '/dsh-usage'

/** A subscription entry the user manages from the panel. */
export type UsageProvider = 'glm' | 'minimax' | 'opencode'

export interface UsageEntry {
  id: string
  provider: UsageProvider
  /** Free-form account label (e.g. "MiniMax 主号"). */
  label: string
  /** API token / key. Stored host-side only, never sent to the browser. */
  apiKey?: string
  /** API endpoint. glm defaults by region; minimax requires it. */
  endpoint?: string
  /** GLM region (bigmodel = 国内, zai = 国际). */
  region?: 'bigmodel' | 'zai'
}

/** One quota bar (remaining view). */
export interface UsageBar {
  /** Bar title, e.g. "5 小时" / "每周" / "本期". */
  label: string
  /** 0–100 remaining percent (100 = full). */
  remainingPercent?: number
  /** Optional raw remaining / total for tooltip. */
  remaining?: number
  total?: number
  unit?: string
  /** Human-readable supplement shown under the label, e.g. "剩余 2.6 小时"
      or "重置于 08-21 09:00". */
  detail?: string
}

/** Per-entry query outcome. */
export interface UsageQueryResult {
  id: string
  label: string
  ok: boolean
  bars?: UsageBar[]
  /** Provider-provided plan level, when available. */
  level?: string
  /** Error message when !ok. */
  message?: string
  /** Manual percent for providers without an API. */
  manualPercent?: number
}

export interface UsageConfig {
  entries: UsageEntry[]
}

export type UsageOp =
  | 'config.read'
  | 'config.write'
  | 'query'

export interface UsagePayload {
  op: UsageOp
  payload?: {
    config?: UsageConfig
  }
}
