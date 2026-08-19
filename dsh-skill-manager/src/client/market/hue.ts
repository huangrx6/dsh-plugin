/**
 * Per-entry identity hue for card icon bases (the "texture" layer of the
 * Quiet Structure upgrade). Each market / installed entry hashes its name
 * to one stable hue so its 40px tile carries a soft low-saturation
 * gradient base (`hsl(h, 55%, 55%)` at 14% → 7%) with the icon tinted a
 * brighter tone of the same hue — the hue is pure identity, not state
 * (installed / updatable / invalid keep their badge colors).
 *
 * The hash is djb2 (seed 5381, hash × 33 + code) reduced mod 360. It is
 * deliberately NOT avalanched like a real hash function — nearby names
 * may land on nearby hues — but it is stable across sessions, cheap,
 * and good enough to give a shelf of cards distinct color identities
 * without storing anything.
 */
import type { CSSProperties } from "react";

/** Stable 0-359 hue for one entry name (djb2 mod 360). */
export function hueFromName(name: string): number {
  let hash = 5381;
  for (let index = 0; index < name.length; index += 1) {
    hash = (Math.imul(hash, 33) + name.charCodeAt(index)) >>> 0;
  }
  return hash % 360;
}

/**
 * React style object publishing the hue as the `--dshm-h` custom property
 * on a card element. Card-scoped CSS (`.dshm-mkt-cardTile`,
 * `.dshm-instCardTile`) reads it to pour the gradient base and icon
 * tint; elements outside a card never see it.
 */
export function hueStyle(name: string): CSSProperties {
  return { "--dshm-h": String(hueFromName(name)) } as CSSProperties;
}
