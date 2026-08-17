import { DEFAULT_SETTINGS, type LayoutSettings } from './types.ts'
import type { LayoutStore } from './store.ts'

/**
 * Path helpers for per-field status and single-field restore. A field
 * declares its setting path ('global.radius', 'content.trace.width', …);
 * status and reset both compare against DEFAULT_SETTINGS, so "overridden"
 * always means "differs from native" — never from some resolved preset.
 */
export function getPath(source: unknown, path: string): unknown {
  let node: unknown = source
  for (const key of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return node
}

function setPathMutable(target: Record<string, unknown>, keys: string[], value: unknown): void {
  const head = keys[0] as string
  const rest = keys.slice(1)
  if (rest.length === 0) {
    target[head] = value
    return
  }
  const child = target[head]
  const clone = child !== null && typeof child === 'object' ? { ...(child as Record<string, unknown>) } : {}
  target[head] = clone
  setPathMutable(clone, rest, value)
}

export function setPath<T>(source: T, path: string, value: unknown): T {
  const clone = { ...(source as Record<string, unknown>) }
  setPathMutable(clone, path.split('.'), value)
  return clone as T
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

export function isOverridden(settings: LayoutSettings, path: string): boolean {
  return !sameJson(getPath(settings, path), getPath(DEFAULT_SETTINGS, path))
}

/** Restores one field to its native default (profiles are preserved). */
export function resetField(store: LayoutStore, path: string): void {
  const snapshot = store.getSnapshot()
  const fallback = getPath(DEFAULT_SETTINGS, path)
  if (sameJson(getPath(snapshot, path), fallback)) return
  store.update(setPath(snapshot, path, fallback) as LayoutSettings)
}

/** Counts leaf settings that differ from the native defaults. */
export function countOverrides(settings: LayoutSettings): number {
  let count = 0
  const walk = (a: unknown, b: unknown): void => {
    if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') {
      if (!sameJson(a, b)) count += 1
      return
    }
    for (const key of Object.keys(a)) walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  }
  walk({ ...settings, profiles: undefined }, { ...DEFAULT_SETTINGS, profiles: undefined })
  return count
}
