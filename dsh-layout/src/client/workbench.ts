import type { DomSync } from "./dom-sync.ts";
import type { LayoutStore } from "./store.ts";

const WORKBENCH_ATTR = "data-dsh-layout-workbench";
const CARD_ATTR = "data-dsh-layout-composer-card";
const CARD_ACTIONS_ATTR = "data-dsh-layout-composer-actions";
const ADD_BUTTON_ATTR = "data-dsh-layout-add-button";
const CARD_TEXT_ATTR = "data-dsh-layout-composer-text";
const CARD_BACKDROP_ATTR = "data-dsh-layout-composer-backdrop";
const ROOT_ATTR = "data-dsh-layout-composer-root";
const DOCK_ATTR = "data-dsh-layout-dock";
const DOCK_ITEM_ATTR = "data-dsh-layout-dock-item";
const SCROLL_ATTR = "data-dsh-layout-scroll-root";
const MARK_SELECTOR = `[${WORKBENCH_ATTR}], [${ROOT_ATTR}], [${CARD_ATTR}], [${CARD_ACTIONS_ATTR}], [${ADD_BUTTON_ATTR}], [${CARD_TEXT_ATTR}], [${CARD_BACKDROP_ATTR}], [${DOCK_ATTR}], [${DOCK_ITEM_ATTR}], [${SCROLL_ATTR}]`;

/** Writes a data marker only when absent — silent in the steady state. */
function toggleMark(element: HTMLElement, attribute: string): void {
  if (!element.hasAttribute(attribute)) element.setAttribute(attribute, "");
}

/** Writes a custom property only when the value actually changed. */
function setVar(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) !== value) {
    element.style.setProperty(name, value);
  }
}

/**
 * Adds a visual shell around the existing composer without moving or replacing
 * any DSH-owned nodes. Data attributes keep the integration reversible and
 * avoid coupling the stylesheet to generated CSS-module class names.
 *
 * Marking happens only while the footer is customized (frosted material and/or
 * full width); otherwise the composer keeps its fully native look. While the
 * store is peeking, marking is skipped the same way.
 *
 * Width is not owned here: the composer card and the dock strips follow the
 * native `--dsh-composer-card-max-width` variable, which the stylesheet points
 * at `none` when the footer width is 'full'. This pass only marks structure —
 * card, actions row, text backdrop, dock zone, scroller — and keeps the shell
 * geometry (edge offsets) fresh.
 */
export class ComposerWorkbench {
  private resizeObserver: ResizeObserver | undefined;
  private unsubscribe: (() => void) | undefined;
  private unregister: (() => void) | undefined;
  private readonly handleViewportChange = (): void => {
    this.sync.requestFull();
  };

  constructor(
    private readonly store: LayoutStore,
    private readonly doc: Document,
    private readonly sync: DomSync,
  ) {}

  install(): () => void {
    const view = this.doc.defaultView;
    if (view === null) return () => {};

    this.unsubscribe = this.store.subscribe(() => {
      this.sync.requestFull();
    });
    // Structural changes only re-remark when they touch a composer bar; the
    // streaming message list never does, so per-token cost is one querySelector.
    this.unregister = this.sync.register({
      onFull: () => {
        this.remark();
      },
      // Class flips (hero -> active posture) change card geometry without any
      // structural mutation; re-evaluate the hero exemption on them.
      onAttribute: (elements) => {
        if (this.doc.querySelector("[data-dsh-layout-workbench]") === null)
          return;
        for (const node of elements) {
          if (
            node.querySelector('[data-slot="conversation.composer.bar"]') !==
              null ||
            node.parentElement?.querySelector(
              '[data-slot="conversation.composer.bar"]',
            ) !== null
          ) {
            this.remark();
            return;
          }
        }
      },
      onStructural: (roots) => {
        // Re-remark when the change touches the composer bar itself OR adds
        // anything inside an already-marked workbench — session-scoped dock
        // entries (todo/queue) render late inside the stack, and their marking
        // must not depend on the bar being part of the same mutation batch.
        for (const root of roots) {
          if (
            root.matches(
              '[data-slot="conversation.composer.bar"], [data-slot="conversation.view"], [data-slot^="conversation.chat."], [data-dsh-layout-workbench]',
            ) ||
            root.querySelector(
              '[data-slot="conversation.composer.bar"], [data-slot="conversation.view"], [data-slot^="conversation.chat."]',
            ) !== null ||
            (this.doc.querySelector("[data-dsh-layout-workbench]") !== null &&
              (root.matches(
                '[data-dsh-layout-dock], [data-dsh-layout-dock-item], [data-queue-dock], [data-slot="conversation.input.dock"]',
              ) ||
                root.querySelector(
                  '[data-dsh-layout-dock], [data-queue-dock], [data-slot="conversation.input.dock"]',
                ) !== null))
          ) {
            this.remark();
            return;
          }
        }
      },
    });
    view.addEventListener("resize", this.handleViewportChange);
    view.visualViewport?.addEventListener("resize", this.handleViewportChange);
    if (view.ResizeObserver !== undefined) {
      this.resizeObserver = new view.ResizeObserver(() => {
        this.updateGeometry();
      });
    }
    this.remark();
    return () => {
      this.dispose();
    };
  }

  dispose(): void {
    const view = this.doc.defaultView;
    this.resizeObserver?.disconnect();
    this.unregister?.();
    this.unsubscribe?.();
    view?.removeEventListener("resize", this.handleViewportChange);
    view?.visualViewport?.removeEventListener(
      "resize",
      this.handleViewportChange,
    );
    this.resizeObserver = undefined;
    this.unregister = undefined;
    this.unsubscribe = undefined;
    this.clearMarkers();
  }

  /** True while the footer is customized enough to need the shell: the
      opaque floor (plate) and/or the full-width geometry. */
  private footerActive(): boolean {
    const { content, footer } = this.store.getSnapshot();
    return !this.store.getPeek() && (footer.plate === "solid" || content.width === "full");
  }

  private remark(): void {
    this.resizeObserver?.disconnect();
    if (!this.footerActive()) {
      this.clearMarkers();
      return;
    }

    // Idempotent marking: attributes and geometry vars are only written when
    // they actually appear, change, or disappear. A clear-then-repaint cycle
    // on every flush would flash markers in DevTools, briefly flip the
    // workbench CSS off, and keep observers busy for nothing.
    const keep = new Set<Element>();
    for (const bar of this.doc.querySelectorAll<HTMLElement>(
      '[data-slot="conversation.composer.bar"]',
    )) {
      const stack = bar.parentElement;
      const root = firstElementChild(bar);
      const card = this.findComposerCard(bar);
      if (stack === null || root === undefined || card === undefined) continue;
      // Hero posture (new-session centered card) and the brief settling phase:
      // the native presentation is intentionally narrower than the workbench
      // column — skip marking so the hero keeps its centered card until the
      // first message settles the view. The conversation root carries the
      // native data-phase attribute, which is more reliable than a width
      // ratio (width overrides can shrink the stack itself).
      const phase = stack.closest("[data-phase]")?.getAttribute("data-phase");
      if (phase === "hero" || phase === "settling") continue;
      // The trace/trajectory tab swaps the message column for its own canvas:
      // the composer stays mounted but its scroller shrinks around the
      // canvas, so the workbench geometry (absolute seat, scroll margin)
      // must not apply there. No chat turns = not the conversation view.
      const scrollRoot = findScrollAncestor(stack, this.doc);
      if (scrollRoot !== undefined && scrollRoot.querySelector('[data-slot^="conversation.chat."]') === null) continue;

      toggleMark(stack, WORKBENCH_ATTR);
      keep.add(stack);
      toggleMark(root, ROOT_ATTR);
      keep.add(root);
      toggleMark(card, CARD_ATTR);
      keep.add(card);
      const actions = directElementChild(card, card.lastElementChild);
      if (actions !== undefined) {
        toggleMark(actions, CARD_ACTIONS_ATTR);
        keep.add(actions);
      }
      const addButton = actions?.querySelector<HTMLButtonElement>("button");
      if (addButton !== undefined && addButton !== null) {
        toggleMark(addButton, ADD_BUTTON_ATTR);
        keep.add(addButton);
      }
      const textarea = card.querySelector<HTMLTextAreaElement>("textarea");
      if (textarea !== null) {
        toggleMark(textarea, CARD_TEXT_ATTR);
        keep.add(textarea);
      }
      const backdrop = elementNode(card, textarea?.previousElementSibling ?? null);
      if (backdrop !== undefined) {
        toggleMark(backdrop, CARD_BACKDROP_ATTR);
        keep.add(backdrop);
      }

      // The input dock hosts DSH-native strips (todo / queue / approvals). Mark
      // the zone and each entry so the stylesheet can restyle every strip into
      // the flat full-width bottom language instead of floating short cards.
      const dock = stack.querySelector<HTMLElement>(
        '[data-slot="conversation.input.dock"]',
      );
      if (dock !== null) {
        toggleMark(dock, DOCK_ATTR);
        keep.add(dock);
        for (const child of Array.from(dock.children)) {
          const item = elementNode(dock, child);
          if (item !== undefined) {
            toggleMark(item, DOCK_ITEM_ATTR);
            keep.add(item);
          }
        }
      }
      // The conversation scroller (no overscroll rubber-band) stays structural;
      // the composer width var lives on the chat root (see ShellRuntime).
      if (scrollRoot !== undefined) {
        toggleMark(scrollRoot, SCROLL_ATTR);
        keep.add(scrollRoot);
      }

      this.resizeObserver?.observe(stack);
      this.resizeObserver?.observe(card);
    }
    this.pruneMarkers(keep);
    this.updateGeometry();
    // Hero posture leaves the seat in native flow; a stale seat-height var
    // would shorten the scroller under a floating sticky seat.
    if (this.doc.querySelector(`[${WORKBENCH_ATTR}]`) === null) {
      for (const root of this.doc.querySelectorAll<HTMLElement>("[data-dsh-layout-chat-root]")) {
        root.style.removeProperty("--dsh-layout-seat-height");
      }
    }
  }

  /** Drops markers (and their vars) that this pass no longer justifies. */
  private pruneMarkers(keep: Set<Element>): void {
    for (const node of this.doc.querySelectorAll<HTMLElement>(MARK_SELECTOR)) {
      if (keep.has(node)) continue;
      node.removeAttribute(WORKBENCH_ATTR);
      node.removeAttribute(ROOT_ATTR);
      node.removeAttribute(CARD_ATTR);
      node.removeAttribute(CARD_ACTIONS_ATTR);
      node.removeAttribute(ADD_BUTTON_ATTR);
      node.removeAttribute(CARD_TEXT_ATTR);
      node.removeAttribute(CARD_BACKDROP_ATTR);
      node.removeAttribute(DOCK_ATTR);
      node.removeAttribute(DOCK_ITEM_ATTR);
      node.removeAttribute(SCROLL_ATTR);
      node.style.removeProperty("--dsh-layout-shell-left");
      node.style.removeProperty("--dsh-layout-shell-right");
      node.style.removeProperty("--dsh-layout-edge-left");
      node.style.removeProperty("--dsh-layout-edge-right");
      node.style.removeProperty("--dsh-layout-scroll-gutter");
    }
  }

  private updateGeometry(): void {
    for (const stack of this.doc.querySelectorAll<HTMLElement>(
      `[${WORKBENCH_ATTR}]`,
    )) {
      const card = stack.querySelector<HTMLElement>(`[${CARD_ATTR}]`);
      if (card === null) continue;
      // 'above' mode pins the seat out of the scroll flow; the scroller's
      // bottom margin must track the seat's live height.
      const chatRoot = stack.closest<HTMLElement>("[data-dsh-layout-chat-root]");
      const seat = stack.closest<HTMLElement>("[data-composer-seat]");
      if (chatRoot !== null && seat !== null) {
        setVar(chatRoot, "--dsh-layout-seat-height", `${Math.round(seat.getBoundingClientRect().height)}px`);
      }
      const stackRect = stack.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      setVar(
        stack,
        "--dsh-layout-shell-left",
        `${Math.max(0, cardRect.left - stackRect.left)}px`,
      );
      setVar(
        stack,
        "--dsh-layout-shell-right",
        `${Math.max(0, stackRect.right - cardRect.right)}px`,
      );
      const scrollRoot = closestMarkedAncestor(stack, SCROLL_ATTR);
      if (scrollRoot !== undefined) {
        const scrollRect = scrollRoot.getBoundingClientRect();
        setVar(
          stack,
          "--dsh-layout-edge-left",
          `${Math.max(0, stackRect.left - scrollRect.left)}px`,
        );
        setVar(
          stack,
          "--dsh-layout-edge-right",
          `${Math.max(0, scrollRect.right - stackRect.right)}px`,
        );
        // Classic scrollbars carve a gutter out of the scrollport; the sticky
        // composer seat fills only the client area, so a full-width composer
        // would stop short of the header's edge. Publish the live gutter width
        // (0 with overlay scrollbars or when nothing overflows) so the
        // stylesheet can stretch the seat across it.
        const gutter = Math.max(0, scrollRoot.offsetWidth - scrollRoot.clientWidth);
        setVar(scrollRoot, "--dsh-layout-scroll-gutter", `${gutter}px`);
      }
    }
  }

  private clearMarkers(): void {
    // Full teardown (dispose, footer back to native): removeProperty and
    // removeAttribute are silent on absent targets, so this stays mutation-
    // free once everything is gone.
    for (const node of this.doc.querySelectorAll<HTMLElement>(MARK_SELECTOR)) {
      node.removeAttribute(WORKBENCH_ATTR);
      node.removeAttribute(ROOT_ATTR);
      node.removeAttribute(CARD_ATTR);
      node.removeAttribute(CARD_ACTIONS_ATTR);
      node.removeAttribute(ADD_BUTTON_ATTR);
      node.removeAttribute(CARD_TEXT_ATTR);
      node.removeAttribute(CARD_BACKDROP_ATTR);
      node.removeAttribute(DOCK_ATTR);
      node.removeAttribute(DOCK_ITEM_ATTR);
      node.removeAttribute(SCROLL_ATTR);
      node.style.removeProperty("--dsh-layout-shell-left");
      node.style.removeProperty("--dsh-layout-shell-right");
      node.style.removeProperty("--dsh-layout-edge-left");
      node.style.removeProperty("--dsh-layout-edge-right");
      node.style.removeProperty("--dsh-layout-scroll-gutter");
    }
  }

  private findComposerCard(bar: HTMLElement): HTMLElement | undefined {
    // The native composer card carries a stable data attribute; the geometry
    // walk below is only a fallback for third-party composer bar entries.
    const native = bar.querySelector<HTMLElement>("[data-composer-card]");
    if (native !== null) return native;
    const view = this.doc.defaultView;
    const textarea = bar.querySelector("textarea");
    let node: HTMLElement | null = textarea?.parentElement ?? null;
    while (node !== null && node !== bar) {
      const style = view?.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (
        style !== undefined &&
        rect.width >= composerCardMinimumWidth(view?.innerWidth ?? 0) &&
        rect.height >= 64 &&
        Number.parseFloat(style.borderTopLeftRadius) >= 12
      )
        return node;
      node = node.parentElement;
    }
    return undefined;
  }
}

export function composerCardMinimumWidth(viewportWidth: number): number {
  return Math.min(300, Math.max(160, viewportWidth * 0.5));
}

function firstElementChild(element: HTMLElement): HTMLElement | undefined {
  return directElementChild(element, element.firstElementChild);
}

function directElementChild(
  element: HTMLElement,
  child: Element | null,
): HTMLElement | undefined {
  const node = elementNode(element, child);
  return node?.parentElement === element ? node : undefined;
}

function elementNode(
  element: HTMLElement,
  child: Element | null,
): HTMLElement | undefined {
  const HTMLElementConstructor = element.ownerDocument.defaultView?.HTMLElement;
  return HTMLElementConstructor !== undefined &&
    child instanceof HTMLElementConstructor
    ? child
    : undefined;
}

function closestMarkedAncestor(
  element: HTMLElement,
  attribute: string,
): HTMLElement | undefined {
  let node = element.parentElement;
  while (node !== null) {
    if (node.hasAttribute(attribute)) return node;
    node = node.parentElement;
  }
  return undefined;
}

/**
 * Structural scroll identity: the nearest ancestor whose overflow-y marks it
 * as the conversation scroller. Deliberately ignores whether the container
 * currently overflows — marking must not depend on content state (a freshly
 * loaded short conversation is still the same scroller).
 */
export function findScrollAncestor(
  start: HTMLElement,
  doc: Document,
): HTMLElement | undefined {
  let node = start.parentElement;
  while (node !== null) {
    const overflowY = doc.defaultView?.getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return undefined;
}
