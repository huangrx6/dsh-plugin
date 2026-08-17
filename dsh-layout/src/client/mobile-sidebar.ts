import type { DomSync } from './dom-sync.ts'
import type { LayoutStore } from './store.ts'

const BREAKPOINT = 767
const ROOT_ATTR = 'data-dsh-layout-mobile-sidebar-open'
const FRAME_SELECTOR = '[data-dsh-layout-frame]'
const SIDEBAR_SELECTOR = '[data-dsh-layout-sidebar-col]'
const CENTER_SELECTOR = '[data-dsh-layout-center-col]'

/**
 * Phones should spend the full viewport on the conversation. The native
 * narrow layout keeps the sidebar column in the grid, permanently squeezing
 * the content area. While the setting is 'fullscreen' (and the viewport is
 * narrow), the sidebar becomes an off-canvas FULLSCREEN overlay with one
 * small floating trigger and a tap-outside mask — the content column owns
 * the whole screen and never deforms. 'native' (the default) keeps DSH's
 * own behavior untouched.
 */
export class MobileSidebarRuntime {
  private media: MediaQueryList | undefined
  private trigger: HTMLButtonElement | undefined
  private mask: HTMLButtonElement | undefined
  private unsubscribe: (() => void) | undefined
  private unregister: (() => void) | undefined
  private readonly onMedia = (): void => { this.render() }
  private readonly onDocumentClick = (event: MouseEvent): void => {
    if (!this.isMobile() || !this.isOpen()) return
    const target = event.target
    const view = this.doc.defaultView
    if (view === null || !(target instanceof view.Node)) return
    const sidebar = this.doc.querySelector<HTMLElement>(SIDEBAR_SELECTOR)
    const targetElement = target instanceof view.Element ? target : target.parentElement
    // Only NAVIGATION closes the overlay (session/workspace selection, links).
    // Plain buttons (settings, add-workspace…) open anchored UI that must keep
    // the drawer visible; the mask / trigger / Esc close explicitly.
    if (sidebar?.contains(target) === true && targetElement?.closest('a, [role="treeitem"]') !== null) {
      this.setOpen(false)
    }
  }
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen()) this.setOpen(false)
  }

  constructor(
    private readonly store: LayoutStore,
    private readonly doc: Document,
    private readonly sync: DomSync,
  ) {}

  install(): () => void {
    const view = this.doc.defaultView
    if (view === null) return () => {}
    this.media = view.matchMedia(`(max-width: ${BREAKPOINT}px)`)
    this.media.addEventListener('change', this.onMedia)
    this.doc.addEventListener('click', this.onDocumentClick)
    this.doc.addEventListener('keydown', this.onKeyDown)
    this.unsubscribe = this.store.subscribe(() => this.render())
    this.unregister = this.sync.register({
      onFull: () => { this.render() },
      onStructural: roots => {
        if (roots.some(root => root.matches(FRAME_SELECTOR) || root.querySelector(FRAME_SELECTOR) !== null)) this.render()
      },
    })
    this.render()
    return () => { this.dispose() }
  }

  dispose(): void {
    this.media?.removeEventListener('change', this.onMedia)
    this.media = undefined
    this.doc.removeEventListener('click', this.onDocumentClick)
    this.doc.removeEventListener('keydown', this.onKeyDown)
    this.unregister?.()
    this.unregister = undefined
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.setOpen(false)
    this.trigger?.remove()
    this.mask?.remove()
    this.trigger = undefined
    this.mask = undefined
    this.doc.documentElement.removeAttribute('data-dsh-layout-mobile-sidebar')
  }

  private active(): boolean {
    return !this.store.getPeek() &&
      this.store.getSnapshot().global.narrow.sidebar === 'fullscreen' &&
      this.media?.matches === true
  }

  private isMobile(): boolean { return this.media?.matches === true }
  private isOpen(): boolean { return this.doc.documentElement.hasAttribute(ROOT_ATTR) }

  private render(): void {
    const frame = this.doc.querySelector<HTMLElement>(FRAME_SELECTOR)
    const sidebar = this.doc.querySelector<HTMLElement>(SIDEBAR_SELECTOR)
    const center = this.doc.querySelector<HTMLElement>(CENTER_SELECTOR)
    if (!this.active() || frame === null || sidebar === null || center === null) {
      this.doc.documentElement.removeAttribute('data-dsh-layout-mobile-sidebar')
      this.setOpen(false)
      // Full teardown of the added chrome — back to native means no leftovers.
      this.trigger?.remove()
      this.mask?.remove()
      this.trigger = undefined
      this.mask = undefined
      return
    }
    this.doc.documentElement.setAttribute('data-dsh-layout-mobile-sidebar', '')
    const trigger = this.ensureTrigger()
    trigger.hidden = false
    this.ensureMask()
  }

  private setOpen(open: boolean): void {
    const root = this.doc.documentElement
    root.toggleAttribute(ROOT_ATTR, open && this.isMobile())
    if (this.trigger !== undefined) {
      this.trigger.setAttribute('aria-expanded', open ? 'true' : 'false')
      this.trigger.setAttribute('aria-label', open ? '关闭侧边栏' : '打开侧边栏')
    }
    if (this.mask !== undefined) this.mask.hidden = !open
  }

  private ensureTrigger(): HTMLButtonElement {
    if (this.trigger?.isConnected === true) return this.trigger
    const trigger = this.doc.createElement('button')
    trigger.type = 'button'
    trigger.className = 'dsh-layout-mobile-sidebar-trigger'
    trigger.setAttribute('aria-controls', 'dsh-layout-mobile-sidebar')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-label', '打开侧边栏')
    trigger.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>'
    trigger.addEventListener('click', event => { event.stopPropagation(); this.setOpen(!this.isOpen()) })
    this.doc.body.append(trigger)
    this.trigger = trigger
    return trigger
  }

  private ensureMask(): HTMLButtonElement {
    if (this.mask?.isConnected === true) return this.mask
    const mask = this.doc.createElement('button')
    mask.type = 'button'
    mask.className = 'dsh-layout-mobile-sidebar-mask'
    mask.setAttribute('aria-label', '关闭侧边栏')
    mask.hidden = true
    mask.addEventListener('click', () => { this.setOpen(false) })
    this.doc.body.append(mask)
    this.mask = mask
    return mask
  }
}
