/**
 * Host half of dsh-launcher. The launcher is a pure client-side plugin —
 * the host side carries no state, no RPC, no patches. It exists only so the
 * plugin has a standards-shaped entry the loader can mount at process start.
 */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-launcher'

export const inject: readonly string[] = []

export function apply(_ctx: Context): void {
  // No host-side work. The launched client bundle owns the launcher panel,
  // the workspace overlay, and the marketplace cart — all DOM and React.
}
