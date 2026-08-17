/**
 * One MutationObserver for the whole plugin.
 *
 * The layout plugin needs several DOM passes (workbench remarking, radius
 * normalization, native-stats suppression). Running an observer per pass meant
 * three full-document callbacks per streaming token. DomSync batches every
 * mutation into a single rAF flush and hands each registered pass exactly the
 * scope it needs: structural passes get the added subtrees, attribute passes
 * get the mutated element. Passes that finish their job can retire themselves.
 *
 * Our own writes never feed back: data-attribute marking is outside the
 * attributeFilter, and inline style writes are idempotent.
 */
export interface DomPass {
  /** Added element subtrees (and self) since the last flush. */
  onStructural?: (roots: Element[]) => void
  /** Elements whose class/style changed since the last flush. */
  onAttribute?: (elements: Element[]) => void
  /** Whole-document pass (initial mount, resize, settings change). */
  onFull?: () => void
}

/** A frozen rAF must never stall a pass for longer than this. */
const WATCHDOG_MS = 250

export class DomSync {
  private observer: MutationObserver | undefined
  private frame = 0
  private watchdog = 0
  private readonly passes = new Set<DomPass>()
  private readonly structuralQueue = new Set<Element>()
  private readonly attributeQueue = new Set<Element>()
  private fullPending = true

  constructor(private readonly doc: Document) {}

  install(): () => void {
    const view = this.doc.defaultView
    if (view === null || view.MutationObserver === undefined) return () => {}
    this.observer = new view.MutationObserver(mutations => {
      if (this.flushing) return
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node instanceof view.Element) this.structuralQueue.add(node)
          }
          // Removals can change geometry of siblings (dock item count); a
          // cheap structural hint on the parent covers reflow-sensitive passes.
          if (mutation.removedNodes.length > 0 && mutation.target instanceof view.Element) {
            this.structuralQueue.add(mutation.target)
          }
        } else if (mutation.target instanceof view.Element) {
          this.attributeQueue.add(mutation.target)
        }
      }
      this.schedule()
    })
    this.observer.observe(this.doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    this.schedule()
    return () => { this.dispose() }
  }

  dispose(): void {
    this.observer?.disconnect()
    this.observer = undefined
    const view = this.doc.defaultView
    if (this.frame !== 0) {
      if (view?.cancelAnimationFrame !== undefined) view.cancelAnimationFrame(this.frame)
      else view?.clearTimeout(this.frame)
      this.frame = 0
    }
    if (this.watchdog !== 0) {
      view?.clearTimeout(this.watchdog)
      this.watchdog = 0
    }
    this.structuralQueue.clear()
    this.attributeQueue.clear()
  }

  register(pass: DomPass): () => void {
    this.passes.add(pass)
    // A late registration wants an immediate full pass.
    this.requestFull()
    return () => { this.passes.delete(pass) }
  }

  /** Request a whole-document pass on the next flush (resize, settings flip). */
  requestFull(): void {
    this.fullPending = true
    this.schedule()
  }

  private schedule(): void {
    if (this.frame !== 0) return
    const view = this.doc.defaultView
    if (view === null) return
    // rAF from the plugin's own view; fall back to a macrotask where rAF is
    // unavailable (test environments), preserving batch semantics.
    const raf = view.requestAnimationFrame
      ?? ((callback: FrameRequestCallback): number => view.setTimeout(() => callback(view.performance.now()), 0) as unknown as number)
    // Hidden webviews freeze rAF entirely (background tabs, occluded panes),
    // which would stall every pass until visibility returns. The watchdog
    // flushes instead; whichever callback runs first wins and disarms the
    // other, so a visible page keeps pure rAF batching.
    const run = (): void => {
      if (this.frame === 0 && this.watchdog === 0) return
      this.frame = 0
      view.clearTimeout(this.watchdog)
      this.watchdog = 0
      this.flush()
    }
    this.frame = raf.call(view, () => run())
    this.watchdog = view.setTimeout(() => {
      this.frame = 0
      run()
    }, WATCHDOG_MS)
  }

  private flushing = false

  private flush(): void {
    const structural = [...this.structuralQueue]
    const attribute = [...this.attributeQueue]
    const full = this.fullPending
    this.structuralQueue.clear()
    this.attributeQueue.clear()
    this.fullPending = false
    this.flushing = true
    try {
      for (const pass of this.passes) {
        if (full) pass.onFull?.()
        if (structural.length > 0) pass.onStructural?.(structural)
        if (attribute.length > 0) pass.onAttribute?.(attribute)
      }
    } finally {
      this.flushing = false
    }
  }

  /** True while passes are running — observers route writes into silence. */
  get isFlushing(): boolean {
    return this.flushing
  }
}
