import type { DomSync } from "./dom-sync.ts";
import type { LayoutStore } from "./store.ts";
import type { GlassArea, GlassMaterial, ReadWidth } from "./types.ts";

const FRAME_ATTR = "data-dsh-layout-frame";
const SIDEBAR_COL_ATTR = "data-dsh-layout-sidebar-col";
const CENTER_COL_ATTR = "data-dsh-layout-center-col";
const DETAILS_COL_ATTR = "data-dsh-layout-details-col";
const HEADER_ATTR = "data-dsh-layout-chrome-header";
const CHAT_ROOT_ATTR = "data-dsh-layout-chat-root";
const CHAT_COLUMN_ATTR = "data-dsh-layout-chat-column";
const COMPOSER_WIDTH_ATTR = "data-dsh-layout-composer-width";
const SHELL_MARK_SELECTOR = `[${FRAME_ATTR}], [${SIDEBAR_COL_ATTR}], [${CENTER_COL_ATTR}], [${DETAILS_COL_ATTR}], [${HEADER_ATTR}], [${CHAT_ROOT_ATTR}], [${CHAT_COLUMN_ATTR}], [${COMPOSER_WIDTH_ATTR}]`;
const DETAILS_TRACK_VAR = "--dsh-layout-details";
const GLASS_AREAS: readonly GlassArea[] = ["sidebar", "header", "content", "footer"];

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
 * Marks the native three-column shell (ui-layout's AppFrame) and the
 * conversation chrome with plugin-owned data attributes, and pushes every
 * visual setting onto <html> as data switches + CSS variables.
 *
 * Locators are all stable DSH landmarks:
 * - the AppFrame is the only entry in the 'root' slot (its first element
 *   child), and exposes `data-sidebar-collapsed` / `data-details-collapsed`
 *   itself;
 * - the three columns are the frame's direct children in a fixed order;
 * - the conversation root and its header sit next to the native
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
      // React rewrites the frame's inline gridTemplateColumns on resize,
      // drag, and details open/close — keep the details-track var fresh.
      onAttribute: (elements) => {
        for (const node of elements) {
          if (node.hasAttribute(FRAME_ATTR)) {
            this.trackDetailsTrack(node as HTMLElement);
            break;
          }
        }
      },
      // The conversation chrome (header slot, scroller, turns) mounts after
      // boot and on conversation switches; re-remark only when the change
      // touches it, never per streaming token (the chat column pass below
      // covers late turn subtrees with one querySelector per flush).
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

  /** Push every visual setting onto <html>; the stylesheet keys off these. */
  private render(): void {
    const settings = this.store.getSnapshot();
    const root = this.doc.documentElement;
    if (this.store.getPeek()) {
      this.clearHtmlState();
      this.sync.requestFull();
      return;
    }
    const { background } = settings.global;
    root.toggleAttribute("data-dsh-layout-bg", background.mode !== "native");
    root.toggleAttribute("data-dsh-layout-fluid", settings.global.fluidGlass);

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

    this.applyGlass(root, "sidebar", settings.sidebar.glass);
    this.applyGlass(root, "content", settings.content.glass);

    this.applyReadWidth(root, settings.content.width);
    const density = settings.content.density;
    root.toggleAttribute("data-dsh-layout-density", density !== null);
    if (density === null) root.style.removeProperty("--dsh-layout-density");
    else root.style.setProperty("--dsh-layout-density", `${density}px`);

    const scale = settings.content.scale;
    root.toggleAttribute("data-dsh-layout-scale", scale !== 100);
    if (scale === 100) {
      root.style.removeProperty("--dsh-layout-scale");
      root.style.removeProperty("--dsh-layout-scale-factor");
    } else {
      root.style.setProperty("--dsh-layout-scale", `${scale}%`);
      // Unitless twin: px insets inside the zoomed scroller divide by it so
      // their on-screen size matches the (unzoomed) header row.
      root.style.setProperty("--dsh-layout-scale-factor", `${scale / 100}`);
    }

    root.dataset.dshLayoutFooterPlate = settings.footer.plate;
    root.style.setProperty("--dsh-layout-input-rows", String(settings.footer.rows));

    root.dataset.dshLayoutScrollbar = settings.content.scrollbar;
    root.dataset.dshLayoutBubble = settings.content.bubble;
    root.dataset.dshLayoutTraceBg = settings.content.trace.background;
    root.dataset.dshLayoutTraceWidth = settings.content.trace.width;
    root.dataset.dshLayoutTraceTail = settings.content.trace.tableTail;
    root.dataset.dshLayoutSidebarDivider = settings.sidebar.divider;
    this.sync.requestFull();
  }

  private applyReadWidth(root: HTMLElement, width: ReadWidth): void {
    if (width === "native") {
      delete root.dataset.dshLayoutReadWidth;
      root.style.removeProperty("--dsh-layout-read-width");
      return;
    }
    root.dataset.dshLayoutReadWidth = width === "full" ? "full" : "custom";
    if (width === "full") root.style.removeProperty("--dsh-layout-read-width");
    else root.style.setProperty("--dsh-layout-read-width", `${width}px`);
  }

  private applyGlass(root: HTMLElement, area: GlassArea, material: GlassMaterial): void {
    const attr = `dshLayout${area[0]!.toUpperCase()}${area.slice(1)}`;
    root.dataset[attr] = material.enabled ? "glass" : "native";
    const color = `--dsh-glass-${area}`;
    const solid = `--dsh-glass-${area}-solid`;
    const card = `--dsh-glass-${area}-card`;
    const blur = `--dsh-glass-${area}-blur`;
    const sat = `--dsh-glass-${area}-sat`;
    if (!material.enabled) {
      for (const key of [color, solid, card, blur, sat]) root.style.removeProperty(key);
      return;
    }
    // The tint mixes in CSS (not JS) so '' keeps following the theme token.
    const base = material.tint === "" ? "var(--dsh-layout-glass-base)" : material.tint;
    root.style.setProperty(color, `color-mix(in srgb, ${base} ${material.opacity}%, transparent)`);
    root.style.setProperty(solid, base);
    root.style.setProperty(card, `color-mix(in srgb, ${base} ${Math.min(material.opacity + 15, 100)}%, transparent)`);
    root.style.setProperty(blur, `${material.blur}px`);
    root.style.setProperty(sat, `${material.saturation}%`);
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
      const details = cols[2];
      if (isElement(sidebar, this.doc)) {
        toggleMark(sidebar, SIDEBAR_COL_ATTR);
        keep.add(sidebar);
      }
      if (isElement(center, this.doc)) {
        toggleMark(center, CENTER_COL_ATTR);
        keep.add(center);
      }
      if (isElement(details, this.doc)) {
        toggleMark(details, DETAILS_COL_ATTR);
        keep.add(details);
      }

      const scroll = this.doc.querySelector<HTMLElement>(
        "[data-conversation-scroll]",
      );
      const chatRoot = scroll?.parentElement;
      if (scroll !== null && isElement(chatRoot, this.doc)) {
        toggleMark(chatRoot, CHAT_ROOT_ATTR);
        keep.add(chatRoot);
        // Full-bleed composer follows the content reading measure, not a
        // separate footer switch. The value matters: the stylesheet keys
        // off ='full'.
        const settings = this.store.getSnapshot();
        const full = !this.store.getPeek() && settings.content.width === "full";
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
      this.trackDetailsTrack(frame);
    }
    for (const node of this.doc.querySelectorAll<HTMLElement>(SHELL_MARK_SELECTOR)) {
      if (keep.has(node)) continue;
      node.removeAttribute(FRAME_ATTR);
      node.removeAttribute(SIDEBAR_COL_ATTR);
      node.removeAttribute(CENTER_COL_ATTR);
      node.removeAttribute(DETAILS_COL_ATTR);
      node.removeAttribute(HEADER_ATTR);
      node.removeAttribute(CHAT_ROOT_ATTR);
      node.removeAttribute(CHAT_COLUMN_ATTR);
      node.removeAttribute(COMPOSER_WIDTH_ATTR);
      node.style.removeProperty(DETAILS_TRACK_VAR);
    }
  }

  /**
   * The message column (native flex column with the 16px rhythm and the
   * --dsh-chat-content-width measure) is reached through any rendered turn;
   * ancestors between the turn and the scroller get marked, so density
   * overrides land on whichever ancestor actually owns the gap.
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

  private trackDetailsTrack(frame: HTMLElement): void {
    const track = this.doc.defaultView
      ?.getComputedStyle(frame)
      .gridTemplateColumns.trim()
      .split(/\s+/u)
      .at(-1);
    if (track === undefined || !/^-?[\d.]+px$/u.test(track)) return;
    setVar(frame, DETAILS_TRACK_VAR, track);
  }

  private clearHtmlState(): void {
    const root = this.doc.documentElement;
    for (const attr of [
      "data-dsh-layout-bg",
      "data-dsh-layout-fluid",
      "data-dsh-layout-radius",
      "data-dsh-layout-density",
      "data-dsh-layout-scale",
      "data-dsh-layout-dialog",
    ]) {
      root.removeAttribute(attr);
    }
    delete root.dataset.dshLayoutSidebar;
    delete root.dataset.dshLayoutHeader;
    delete root.dataset.dshLayoutContent;
    delete root.dataset.dshLayoutFooter;
    delete root.dataset.dshLayoutFooterPlate;
    delete root.dataset.dshLayoutReadWidth;
    delete root.dataset.dshLayoutScrollbar;
    delete root.dataset.dshLayoutBubble;
    delete root.dataset.dshLayoutTraceBg;
    delete root.dataset.dshLayoutTraceWidth;
    delete root.dataset.dshLayoutTraceTail;
    delete root.dataset.dshLayoutSidebarDivider;
    for (const key of [
      "--dsh-layout-radius-user",
      "--dsh-layout-radius-user-lg",
      "--dsh-layout-ring-mask",
      "--dsh-layout-read-width",
      "--dsh-layout-density",
      "--dsh-layout-scale",
      "--dsh-layout-scale-factor",
      "--dsh-layout-input-rows",
      "--dsh-layout-dialog-width",
      "--dsh-layout-dialog-height",
    ]) {
      root.style.removeProperty(key);
    }
    for (const area of GLASS_AREAS) {
      for (const suffix of ["", "-solid", "-card", "-blur", "-sat"]) {
        root.style.removeProperty(`--dsh-glass-${area}${suffix}`);
      }
    }
  }

  private clearMarkers(): void {
    for (const node of this.doc.querySelectorAll<HTMLElement>(
      `[${FRAME_ATTR}], [${SIDEBAR_COL_ATTR}], [${CENTER_COL_ATTR}], [${DETAILS_COL_ATTR}], [${HEADER_ATTR}], [${CHAT_ROOT_ATTR}], [${CHAT_COLUMN_ATTR}], [${COMPOSER_WIDTH_ATTR}]`,
    )) {
      node.style.removeProperty(DETAILS_TRACK_VAR);
      node.removeAttribute(FRAME_ATTR);
      node.removeAttribute(SIDEBAR_COL_ATTR);
      node.removeAttribute(CENTER_COL_ATTR);
      node.removeAttribute(DETAILS_COL_ATTR);
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
