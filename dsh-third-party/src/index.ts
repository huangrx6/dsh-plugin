/** Host half of dsh-third-party: a marker-only plugin. All real work is client-side (settings section + tab hub). */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-third-party'

export const inject: readonly string[] = []

export function apply(_ctx: Context): void {
  void _ctx
}
