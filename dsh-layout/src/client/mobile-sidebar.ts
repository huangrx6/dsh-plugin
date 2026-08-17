import type { DomSync } from './dom-sync.ts'
import type { LayoutStore } from './store.ts'

const BREAKPOINT = 767
const ROOT_ATTR = 'data-dsh-layout-mobile-sidebar-open'
const FRAME_SELECTOR = '[data-dsh-layout-frame]'
const SIDEBAR_SELECTOR = '[data-dsh-layout-sidebar-col]'
const CENTER_SELECTOR = '[data-dsh-layout-center-col]'
/** The native rail/wide toggle (fish logo when collapsed, panel icon when
    wide) — DSH's own button, stable by class and present in both states. */
const TOGGLE_SELECTOR = `${SIDEBAR_SELECTOR} button[class*='toggle']`
/** Open affordance: swipe from the left edge, or tap the slim edge handle. */
const EDGE_ZONE = 24
const SWIPE_THRESHOLD = 48

/**
 * Phones should spend the full viewport on the conversation. While the
 * setting is 'fullscreen' (and the viewport is narrow), the sidebar becomes
 * an off-canvas FULLSCREEN overlay — the content column never squeezes.
 *
 * The key trick: DSH marks the mobile sidebar `collapsed` (an icon rail whose
 * content sits at opacity:0 until expanded), so merely sliding the column out
 * shows a fogged, non-interactive shell. Opening the drawer therefore clicks
 * DSH's OWN toggle button (expanding to the real wide state), and closing it
 * collapses back — the drawer always shows real content. The frame's
 * collapsed attribute is watched so a native in-drawer collapse self-heals
 * by closing the drawer.
 *
 * No floating chrome: open by swiping from the left edge or tapping the slim
 * edge handle; close via the mask, Escape, or navigation.
 */
export class MobileSidebarRuntime {
  private media: MediaQueryList | undefined
  private trigger: HTMLButtonElement | undefined
  private closeButton: HTMLButtonElement | undefined
  private mask: HTMLButtonElement | undefined
  private frameObserver: MutationObserver | undefined
  private unsubscribe: (() => void) | undefined
  private unregister: (() => void) | undefined
  private touchStartX = 0
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
      this.close()
    }
  }
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen()) this.close()
  }
  private readonly onTouchStart = (event: TouchEvent): void => {
    if (!this.isMobile() || this.isOpen()) return
    const x = event.touches[0]?.clientX
    if (x !== undefined && x <= EDGE_ZONE) this.touchStartX = x
    else this.touchStartX = 0
  }
  private readonly onTouchEnd = (event: TouchEvent): void => {
    if (this.touchStartX === 0) return
    const x = event.changedTouches[0]?.clientX ?? 0
    if (x - this.touchStartX >= SWIPE_THRESHOLD) this.open()
    this.touchStartX = 0
  }
  private readonly onFrameChange = (): void => {
    // DSH collapsed the sidebar (native toggle inside the drawer) while our
    // drawer is open: the rail fog would return — slide the drawer away.
    const frame = this.doc.querySelector(FRAME_SELECTOR)
    if (this.isOpen() && frame?.hasAttribute('data-sidebar-collapsed')) this.setOpen(false)
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
    this.doc.addEventListener('touchstart', this.onTouchStart, { passive: true })
    this.doc.addEventListener('touchend', this.onTouchEnd, { passive: true })
    this.frameObserver = new view.MutationObserver(this.onFrameChange)
    this.unsubscribe = this.store.subscribe(() => this.render())
    this.unregister = this.sync.register({
      onFull: () => {
        this.observeFrame()
        this.render()
      },
      onStructural: roots => {
        if (roots.some(root => root.matches(FRAME_SELECTOR) || root.querySelector(FRAME_SELECTOR) !== null)) {
          this.observeFrame()
          this.render()
        }
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
    this.doc.removeEventListener('touchstart', this.onTouchStart)
    this.doc.removeEventListener('touchend', this.onTouchEnd)
    this.frameObserver?.disconnect()
    this.frameObserver = undefined
    this.unregister?.()
    this.unregister = undefined
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.setOpen(false)
    this.trigger?.remove()
    this.closeButton?.remove()
    this.mask?.remove()
    this.trigger = undefined
    this.closeButton = undefined
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

  private observeFrame(): void {
    const frame = this.doc.querySelector(FRAME_SELECTOR)
    if (frame === null || this.frameObserver === undefined) return
    this.frameObserver.disconnect()
    this.frameObserver.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
  }

  /** DSH renders real sidebar content only in its wide state; click the
      native toggle so the drawer opens expanded (and collapses back on
      close), instead of showing the fogged collapsed rail. */
  private syncNative(expand: boolean): void {
    const frame = this.doc.querySelector(FRAME_SELECTOR)
    const toggle = this.doc.querySelector<HTMLButtonElement>(TOGGLE_SELECTOR)
    if (frame === null || toggle === null) return
    const collapsed = frame.hasAttribute('data-sidebar-collapsed')
    if (expand && collapsed) toggle.click()
    else if (!expand && !collapsed) toggle.click()
  }

  private open(): void {
    this.syncNative(true)
    this.setOpen(true)
  }

  private close(): void {
    this.setOpen(false)
    this.syncNative(false)
  }

  private render(): void {
    const frame = this.doc.querySelector<HTMLElement>(FRAME_SELECTOR)
    const sidebar = this.doc.querySelector<HTMLElement>(SIDEBAR_SELECTOR)
    const center = this.doc.querySelector<HTMLElement>(CENTER_SELECTOR)
    if (!this.active() || frame === null || sidebar === null || center === null) {
      this.doc.documentElement.removeAttribute('data-dsh-layout-mobile-sidebar')
      this.setOpen(false)
      // Full teardown of the added chrome — back to native means no leftovers.
      this.trigger?.remove()
      this.closeButton?.remove()
      this.mask?.remove()
      this.trigger = undefined
      this.closeButton = undefined
      this.mask = undefined
      return
    }
    this.doc.documentElement.setAttribute('data-dsh-layout-mobile-sidebar', '')
    this.ensureTrigger()
    this.ensureClose()
    this.ensureMask()
  }

  private setOpen(open: boolean): void {
    const root = this.doc.documentElement
    root.toggleAttribute(ROOT_ATTR, open && this.isMobile())
    if (this.trigger !== undefined) {
      this.trigger.hidden = open
      this.trigger.setAttribute('aria-expanded', open ? 'true' : 'false')
      this.trigger.setAttribute('aria-label', open ? '关闭侧边栏' : '打开侧边栏')
    }
    if (this.closeButton !== undefined) this.closeButton.hidden = !open
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
    const glyph = this.doc.createElement('span')
    glyph.setAttribute('aria-hidden', 'true')
    trigger.append(glyph)
    trigger.addEventListener('click', event => { event.stopPropagation(); this.open() })
    this.doc.body.append(trigger)
    this.trigger = trigger
    return trigger
  }

  private ensureClose(): HTMLButtonElement {
    if (this.closeButton?.isConnected === true) return this.closeButton
    const close = this.doc.createElement('button')
    close.type = 'button'
    close.className = 'dsh-layout-mobile-sidebar-close'
    close.setAttribute('aria-label', '关闭侧边栏')
    close.hidden = true
    const glyph = this.doc.createElement('span')
    glyph.setAttribute('aria-hidden', 'true')
    close.append(glyph)
    close.addEventListener('click', () => { this.close() })
    this.doc.body.append(close)
    this.closeButton = close
    return close
  }

  private ensureMask(): HTMLButtonElement {
    if (this.mask?.isConnected === true) return this.mask
    const mask = this.doc.createElement('button')
    mask.type = 'button'
    mask.className = 'dsh-layout-mobile-sidebar-mask'
    mask.setAttribute('aria-label', '关闭侧边栏')
    mask.hidden = true
    mask.addEventListener('click', () => { this.close() })
    this.doc.body.append(mask)
    this.mask = mask
    return mask
  }
}
