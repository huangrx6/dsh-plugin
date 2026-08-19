/**
 * Per-item card coloring: hash a server / market item name into a stable
 * hue so every entry owns one soft, low-saturation color for its icon
 * plinth gradient (≈ hsl(h, 55%, 55%) poured at 14% → 7%). djb2 keeps the
 * mapping deterministic across sessions while spreading names reasonably
 * evenly around the wheel.
 */
import type { CSSProperties } from 'react'

/** djb2 hash of the name, folded into a 0–359 hue. */
export function nameHue(name: string): number {
  let hash = 5381
  for (let index = 0; index < name.length; index += 1) {
    hash = ((hash << 5) + hash + name.charCodeAt(index)) | 0
  }
  return Math.abs(hash) % 360
}

/** React style payload carrying the hue to the CSS side (`--dshmcp-hue`). */
export function hueStyle(name: string): CSSProperties {
  return { '--dshmcp-hue': String(nameHue(name)) } as CSSProperties
}
