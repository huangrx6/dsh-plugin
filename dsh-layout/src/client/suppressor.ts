import type { DomSync } from './dom-sync.ts'
import type { LayoutStore } from './store.ts'

const STATS_STYLE_ID = '@deepseek-ai/dsh-client-ui-conversation/StatsLine.module.css'
const SUPPRESS_STYLE_ID = 'dsh-layout-stats-suppression'
const ACTIVE_ATTR = 'data-dsh-layout-active'

/**
 * Hides the built-in StatsLine with a single stylesheet rule instead of
 * per-element inline styles. The rule targets the native module's hashed root
 * class, extracted once from DSH's injected style tag; suppression toggles by
 * an attribute on <html>, so enabling/disabling (and teardown) never mutates
 * the React-owned subtree. A DomSync structural pass covers the window where
 * DSH injects its stylesheet after this plugin boots, retiring itself once the
 * rule exists.
 */
export class OriginalStatsSuppressor {
  private unsubscribe: (() => void) | undefined
  private unregister: (() => void) | undefined
  private built = false

  constructor(
    private readonly store: LayoutStore,
    private readonly doc: Document,
    private readonly sync: DomSync,
  ) {}

  install(): () => void {
    this.unsubscribe = this.store.subscribe(() => { this.apply() })
    this.unregister = this.sync.register({
      onFull: () => { this.buildRule(); this.apply() },
      onStructural: () => {
        if (this.built) return
        this.buildRule()
        this.apply()
      },
    })
    return () => { this.dispose() }
  }

  dispose(): void {
    this.unregister?.()
    this.unregister = undefined
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.doc.getElementById(SUPPRESS_STYLE_ID)?.remove()
    this.doc.documentElement.removeAttribute(ACTIVE_ATTR)
    this.built = false
  }

  private buildRule(): void {
    if (this.built) return
    const tag = this.doc.querySelector<HTMLStyleElement>(`style[data-plugin-css="${STATS_STYLE_ID}"]`)
    const rootClass = tag?.textContent?.match(/\.([A-Za-z0-9_-]+_root)\s*\{/u)?.[1]
    if (rootClass === undefined) return
    const style = this.doc.createElement('style')
    style.id = SUPPRESS_STYLE_ID
    style.dataset.plugin = 'dsh-layout'
    style.textContent = `html[${ACTIVE_ATTR}] .${rootClass} { display: none !important; }`
    this.doc.head.append(style)
    this.built = true
  }

  private apply(): void {
    const active = !this.store.getPeek() && this.store.getSnapshot().conversation.stats !== 'native' && this.built
    this.doc.documentElement.toggleAttribute(ACTIVE_ATTR, active)
  }
}
