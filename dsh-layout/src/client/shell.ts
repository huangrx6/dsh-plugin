import type { DomSync } from "./dom-sync.ts";
import type { LayoutStore } from "./store.ts";
import type { MaterialSettings } from "./types.ts";

const FRAME_ATTR = "data-dsh-layout-frame";
const SIDEBAR_COL_ATTR = "data-dsh-layout-sidebar-col";
const SIDEBAR_LIST_ATTR = "data-dsh-layout-sidebar-list";
const CENTER_COL_ATTR = "data-dsh-layout-center-col";
const HEADER_ATTR = "data-dsh-layout-chrome-header";
const CHAT_ROOT_ATTR = "data-dsh-layout-chat-root";
const CHAT_COLUMN_ATTR = "data-dsh-layout-chat-column";
const COMPOSER_WIDTH_ATTR = "data-dsh-layout-composer-width";
const SHELL_MARK_SELECTOR = `[${FRAME_ATTR}], [${SIDEBAR_COL_ATTR}], [${SIDEBAR_LIST_ATTR}], [${CENTER_COL_ATTR}], [${HEADER_ATTR}], [${CHAT_ROOT_ATTR}], [${CHAT_COLUMN_ATTR}], [${COMPOSER_WIDTH_ATTR}]`;

/** Writes a data marker only when absent — silent in the steady state. */
function toggleMark(element: HTMLElement, attribute: string): void {
  if (!element.hasAttribute(attribute)) element.setAttribute(attribute, "");
}

/**
 * Marks the native three-column shell (ui-layout's AppFrame) and the
 * conversation chrome with plugin-owned data attributes, and pushes every
 * setting onto <html> as data switches + CSS variables.
 *
 * Locators are all stable DSH landmarks:
 * - the AppFrame is the only entry in the 'root' slot (its first element
 *   child);
 * - the sidebar column and the center column are the frame's direct
 *   children in a fixed order; the session list is the tree inside the
 *   sidebar column;
 * - the conversation root sits next to the native
 *   `[data-conversation-scroll]` scroller;
 * - the message column is the scroller-child ancestor of a turn slot.
 *
 * Marking is non-visual: attributes only name native nodes so the stylesheet
 * can address them. While the store is peeking ("hold to compare native"),
 * render() pushes nothing, so every surface falls back to DSH-native looks.
 */
export class ShellRuntime {
  private unsubscribe: (() => void) | undefined;
  private unregister: (() => void) | undefined;

  constructor(
    private readonly store: LayoutStore,
    private readonly doc: Document,
    private readonly sync: DomSync,
  ) {}

  install(): () => void {
    this.unsubscribe = this.store.subscribe(() => this.render());
    this.unregister = this.sync.register({
      onFull: () => {
        this.remark();
      },
      // The conversation chrome (scroller, turns) mounts after boot and on
      // conversation switches; re-remark only when the change touches it,
      // never per streaming token (the chat column pass below covers late
      // turn subtrees with one querySelector per flush).
      onStructural: (roots) => {
        for (const root of roots) {
          if (
            root.matches(
              'header, [data-slot="conversation.session.header"], [data-conversation-scroll], [data-slot="conversation.chat.turn"], [data-slot="conversation.chat.node"]',
            ) ||
            root.querySelector(
              '[data-slot="conversation.session.header"], [data-conversation-scroll], [data-slot="conversation.chat.turn"], [data-slot="conversation.chat.node"]',
            ) !== null
          ) {
            this.remark();
            return;
          }
          this.markChatColumn(new Set<Element>());
        }
      },
    });
    this.render();
    return () => {
      this.dispose();
    };
  }

  dispose(): void {
    this.unregister?.();
    this.unregister = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.clearHtmlState();
    this.clearMarkers();
  }

  /** Push every setting onto <html>; the stylesheet keys off these. */
  private render(): void {
    const settings = this.store.getSnapshot();
    const root = this.doc.documentElement;
    if (this.store.getPeek()) {
      this.clearHtmlState();
      this.sync.requestFull();
      return;
    }

    this.applyMaterial(root, settings.material);

    const { background } = settings.global;
    root.toggleAttribute("data-dsh-layout-bg", background.mode !== "native");

    const radius = settings.global.radius;
    root.toggleAttribute("data-dsh-layout-radius", radius !== null);
    if (radius === null) {
      root.style.removeProperty("--dsh-layout-radius-user");
      root.style.removeProperty("--dsh-layout-radius-user-lg");
      root.style.removeProperty("--dsh-layout-ring-mask");
    } else {
      root.style.setProperty("--dsh-layout-radius-user", `${radius}px`);
      root.style.setProperty("--dsh-layout-radius-user-lg", `${Math.min(radius + 4, 24)}px`);
      root.style.setProperty("--dsh-layout-ring-mask", ringMask(radius));
    }

    // Settings dialog panel size (null = DSH native 800×min(800, vh−48)).
    const { dialog } = settings.global;
    if (dialog.width === null && dialog.height === null) {
      root.removeAttribute("data-dsh-layout-dialog");
      root.style.removeProperty("--dsh-layout-dialog-width");
      root.style.removeProperty("--dsh-layout-dialog-height");
    } else {
      root.setAttribute("data-dsh-layout-dialog", "");
      if (dialog.width !== null) root.style.setProperty("--dsh-layout-dialog-width", `${dialog.width}px`);
      else root.style.removeProperty("--dsh-layout-dialog-width");
      if (dialog.height !== null) root.style.setProperty("--dsh-layout-dialog-height", `${dialog.height}px`);
      else root.style.removeProperty("--dsh-layout-dialog-height");
    }

    // Page padding tokens: only EXPLICIT custom values become inline
    // variables — unset sides keep the preset (or the native CSS entirely,
    // outside full-width mode), never a forced default.
    const { padding, narrow } = settings.global;
    root.toggleAttribute("data-dsh-layout-padding-custom", padding.mode === "custom");
    for (const area of ["header", "content", "composer"] as const) {
      const sides = padding[area];
      for (const [side, token] of [["left", "start"], ["right", "end"]] as const) {
        const name = `--dsh-layout-pad-${area}-${token}`;
        const value = padding.mode === "custom" ? sides[side] : null;
        if (value !== null) root.style.setProperty(name, `${value}px`);
        else root.style.removeProperty(name);
      }
    }
    root.toggleAttribute("data-dsh-layout-narrow-wrap", narrow.headerWrap);

    root.dataset.dshLayoutScrollbar = settings.global.scrollbar;
    root.dataset.dshLayoutScrollEnd = settings.conversation.scrollEnd;
    root.dataset.dshLayoutBubble = settings.conversation.bubble;
    root.dataset.dshLayoutTraceBg = settings.conversation.trace.background;
    root.dataset.dshLayoutTraceWidth = settings.conversation.trace.width;
    root.dataset.dshLayoutTraceTail = settings.conversation.trace.tableTail;
    if (settings.conversation.width === "full") root.dataset.dshLayoutReadWidth = "full";
    else delete root.dataset.dshLayoutReadWidth;

    const rows = settings.conversation.inputRows;
    root.toggleAttribute("data-dsh-layout-input-rows", rows !== null);
    if (rows === null) root.style.removeProperty("--dsh-layout-input-rows");
    else root.style.setProperty("--dsh-layout-input-rows", String(rows));

    this.sync.requestFull();
  }

  /** The one page material: tint / solid / blur / saturation as variables the
      two ::before sheets read. Native state removes every var. */
  private applyMaterial(root: HTMLElement, material: MaterialSettings): void {
    root.dataset.dshLayoutMaterial = material.enabled ? "on" : "off";
    if (!material.enabled) {
      for (const key of ["--dsh-layout-mat", "--dsh-layout-mat-solid", "--dsh-layout-mat-blur", "--dsh-layout-mat-sat"]) {
        root.style.removeProperty(key);
      }
      return;
    }
    root.style.setProperty("--dsh-layout-mat", `color-mix(in srgb, var(--dsh-layout-glass-base) ${material.opacity}%, transparent)`);
    root.style.setProperty("--dsh-layout-mat-solid", "var(--dsh-layout-glass-base)");
    root.style.setProperty("--dsh-layout-mat-blur", `${material.blur}px`);
    root.style.setProperty("--dsh-layout-mat-sat", `${material.saturation}%`);
  }

  private remark(): void {
    // Idempotent marking: markers are only written when they actually appear
    // or disappear, so a steady-state re-remark performs zero DOM writes and
    // nothing flickers in DevTools.
    const keep = new Set<Element>();
    const frame = this.findFrame();
    if (frame !== undefined) {
      toggleMark(frame, FRAME_ATTR);
      keep.add(frame);
      const cols = frame.children;
      const sidebar = cols[0];
      const center = cols[1];
      if (isElement(sidebar, this.doc)) {
        toggleMark(sidebar, SIDEBAR_COL_ATTR);
        keep.add(sidebar);
        const list = sidebar.querySelector<HTMLElement>('[role="tree"]');
        if (list !== null) {
          toggleMark(list, SIDEBAR_LIST_ATTR);
          keep.add(list);
        }
      }
      if (isElement(center, this.doc)) {
        toggleMark(center, CENTER_COL_ATTR);
        keep.add(center);
      }

      const scroll = this.doc.querySelector<HTMLElement>(
        "[data-conversation-scroll]",
      );
      const chatRoot = scroll?.parentElement;
      if (scroll !== null && isElement(chatRoot, this.doc)) {
        toggleMark(chatRoot, CHAT_ROOT_ATTR);
        keep.add(chatRoot);
        // Full-bleed composer follows the reading measure, not a separate
        // switch. The value matters: the stylesheet keys off ='full'.
        const settings = this.store.getSnapshot();
        const full = !this.store.getPeek() && settings.conversation.width === "full";
        if (full) {
          if (chatRoot.getAttribute(COMPOSER_WIDTH_ATTR) !== "full") {
            chatRoot.setAttribute(COMPOSER_WIDTH_ATTR, "full");
          }
        } else if (chatRoot.hasAttribute(COMPOSER_WIDTH_ATTR)) {
          chatRoot.removeAttribute(COMPOSER_WIDTH_ATTR);
        }
        const headerAnchor = scroll.previousElementSibling;
        const header =
          headerAnchor === null
            ? null
            : isElement(headerAnchor.firstElementChild, this.doc)
              ? headerAnchor.firstElementChild
              : headerAnchor;
        if (isElement(header, this.doc)) {
          toggleMark(header, HEADER_ATTR);
          keep.add(header);
        }
        this.markChatColumn(keep);
      }
    }
    for (const node of this.doc.querySelectorAll<HTMLElement>(SHELL_MARK_SELECTOR)) {
      if (keep.has(node)) continue;
      node.removeAttribute(FRAME_ATTR);
      node.removeAttribute(SIDEBAR_COL_ATTR);
      node.removeAttribute(SIDEBAR_LIST_ATTR);
      node.removeAttribute(CENTER_COL_ATTR);
      node.removeAttribute(HEADER_ATTR);
      node.removeAttribute(CHAT_ROOT_ATTR);
      node.removeAttribute(CHAT_COLUMN_ATTR);
      node.removeAttribute(COMPOSER_WIDTH_ATTR);
    }
  }

  /**
   * The message column (native flex column with the 16px rhythm and the
   * --dsh-chat-content-width measure) is reached through any rendered turn;
   * ancestors between the turn and the scroller get marked, so bubble and
   * full-width overrides land on whichever ancestor actually owns them.
   */
  private markChatColumn(keep: Set<Element>): void {
    const scroll = this.doc.querySelector<HTMLElement>("[data-conversation-scroll]");
    if (scroll === null) return;
    const turn = scroll.querySelector<HTMLElement>('[data-slot^="conversation.chat."]');
    let node = turn ?? null;
    while (node !== null) {
      if (node.parentElement === scroll) {
        if (!node.hasAttribute(CHAT_COLUMN_ATTR)) node.setAttribute(CHAT_COLUMN_ATTR, "");
        keep.add(node);
        return;
      }
      toggleMark(node, CHAT_COLUMN_ATTR);
      keep.add(node);
      node = node.parentElement;
    }
  }

  private findFrame(): HTMLElement | undefined {
    const view = this.doc.defaultView;
    const anchor = this.doc.querySelector('[data-slot="root"]');
    const frame = anchor?.firstElementChild;
    return view !== null &&
      view !== undefined &&
      frame instanceof view.HTMLElement
      ? frame
      : undefined;
  }

  private clearHtmlState(): void {
    const root = this.doc.documentElement;
    for (const attr of [
      "data-dsh-layout-bg",
      "data-dsh-layout-radius",
      "data-dsh-layout-dialog",
      "data-dsh-layout-narrow-wrap",
      "data-dsh-layout-padding-custom",
    ]) {
      root.removeAttribute(attr);
    }
    delete root.dataset.dshLayoutMaterial;
    delete root.dataset.dshLayoutScrollbar;
    delete root.dataset.dshLayoutScrollEnd;
    delete root.dataset.dshLayoutBubble;
    delete root.dataset.dshLayoutTraceBg;
    delete root.dataset.dshLayoutTraceWidth;
    delete root.dataset.dshLayoutTraceTail;
    delete root.dataset.dshLayoutReadWidth;
    root.removeAttribute("data-dsh-layout-input-rows");
    for (const key of [
      "--dsh-layout-radius-user",
      "--dsh-layout-radius-user-lg",
      "--dsh-layout-ring-mask",
      "--dsh-layout-dialog-width",
      "--dsh-layout-dialog-height",
      "--dsh-layout-mat",
      "--dsh-layout-mat-solid",
      "--dsh-layout-mat-blur",
      "--dsh-layout-mat-sat",
      "--dsh-layout-input-rows",
      "--dsh-layout-pad-header-start",
      "--dsh-layout-pad-header-end",
      "--dsh-layout-pad-content-start",
      "--dsh-layout-pad-content-end",
      "--dsh-layout-pad-composer-start",
      "--dsh-layout-pad-composer-end",
    ]) {
      root.style.removeProperty(key);
    }
  }

  private clearMarkers(): void {
    for (const node of this.doc.querySelectorAll<HTMLElement>(SHELL_MARK_SELECTOR)) {
      node.removeAttribute(FRAME_ATTR);
      node.removeAttribute(SIDEBAR_COL_ATTR);
      node.removeAttribute(SIDEBAR_LIST_ATTR);
      node.removeAttribute(CENTER_COL_ATTR);
      node.removeAttribute(HEADER_ATTR);
      node.removeAttribute(CHAT_ROOT_ATTR);
      node.removeAttribute(CHAT_COLUMN_ATTR);
      node.removeAttribute(COMPOSER_WIDTH_ATTR);
    }
  }
}

/**
 * Clone of the native workspace-trigger ring mask — an SVG rect with a dashed
 * stroke — with the corner radius swapped for the user's value. The radius is
 * baked into the data URI, so no CSS border-radius override can reach it.
 */
function ringMask(radius: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='none' rx='${radius}' ry='${radius}' stroke='black' stroke-width='2' stroke-dasharray='4 4'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Document-scoped element check — JSDOM test environments have no global HTMLElement. */
function isElement(
  node: Element | null | undefined,
  doc: Document,
): node is HTMLElement {
  const view = doc.defaultView;
  return (
    view !== null && view !== undefined && node instanceof view.HTMLElement
  );
}
