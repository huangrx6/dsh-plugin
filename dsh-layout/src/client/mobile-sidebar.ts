import type { DomSync } from "./dom-sync.ts";
import type { LayoutStore } from "./store.ts";
import type { MobileSidebarMode, WideSidebarMode } from "./types.ts";

const BREAKPOINT = 767;
const ROOT_ATTR = "data-dsh-layout-mobile-sidebar-open";
const FRAME_SELECTOR = "[data-dsh-layout-frame]";
const SIDEBAR_SELECTOR = "[data-dsh-layout-sidebar-col]";
const CENTER_SELECTOR = "[data-dsh-layout-center-col]";
/** Native DSH chat scroller — the stable landmark that only conversation /
    trace views mount. Any other shell page (settings dialog, personal space,
    profile, etc.) also has the three columns above but lacks this scroller,
    so gating the drawer chrome on it keeps the trigger / close / mask on
    chat pages only. Edge-swipe still opens the drawer on every page. */
const SCROLL_SELECTOR = "[data-conversation-scroll]";
/** The native rail/wide toggle (fish logo when collapsed, panel icon when
    wide) — DSH's own button, stable by class and present in both states. */
const TOGGLE_SELECTOR = `${SIDEBAR_SELECTOR} button[class*='toggle']`;
/** Open affordance: swipe from the left edge, or tap the slim edge handle. */
const EDGE_ZONE = 24;
const SWIPE_THRESHOLD = 48;

/**
 * Off-canvas sidebar drawer. The narrow (< 768px) and wide (≥ 768px)
 * settings each pick their own mode independently: fullscreen (phone-only)
 * or float (fixed-width panel over the content) run the drawer on their
 * viewport; native on both means DSH's own inline sidebar, untouched.
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
  private media: MediaQueryList | undefined;
  private trigger: HTMLButtonElement | undefined;
  private closeButton: HTMLButtonElement | undefined;
  private mask: HTMLButtonElement | undefined;
  private frameObserver: MutationObserver | undefined;
  private unsubscribe: (() => void) | undefined;
  private unregister: (() => void) | undefined;
  private touchStartX = 0;
  private readonly onMedia = (): void => {
    this.render();
  };
  private readonly onDocumentClick = (event: MouseEvent): void => {
    if (!this.isDrawerActive() || !this.isOpen()) return;
    const target = event.target;
    const view = this.doc.defaultView;
    if (view === null || !(target instanceof view.Node)) return;
    const sidebar = this.doc.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
    const targetElement =
      target instanceof view.Element ? target : target.parentElement;
    // Only NAVIGATION closes the overlay (session/workspace selection, links).
    // Plain buttons (settings, add-workspace…) open anchored UI that must keep
    // the drawer visible; the mask / trigger / Esc close explicitly.
    // A treeitem carrying aria-expanded is a WORKSPACE DIRECTORY toggle
    // (collapse/expand), not navigation — tapping it must keep the drawer.
    const nav = targetElement?.closest('a, [role="treeitem"]') ?? null
    if (
      sidebar?.contains(target) === true &&
      nav !== null &&
      !(nav.getAttribute('role') === 'treeitem' && nav.hasAttribute('aria-expanded'))
    ) {
      this.close();
    }
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.isOpen()) this.close();
  };
  private readonly onTouchStart = (event: TouchEvent): void => {
    if (!this.isDrawerActive() || this.isOpen()) return;
    const x = event.touches[0]?.clientX;
    if (x !== undefined && x <= EDGE_ZONE) this.touchStartX = x;
    else this.touchStartX = 0;
  };
  private readonly onTouchEnd = (event: TouchEvent): void => {
    if (this.touchStartX === 0) return;
    const x = event.changedTouches[0]?.clientX ?? 0;
    if (x - this.touchStartX >= SWIPE_THRESHOLD) this.open();
    this.touchStartX = 0;
  };
  private readonly onFrameChange = (): void => {
    // DSH collapsed the sidebar (native toggle inside the drawer) while our
    // drawer is open: the rail fog would return — slide the drawer away.
    const frame = this.doc.querySelector(FRAME_SELECTOR);
    if (this.isOpen() && frame?.hasAttribute("data-sidebar-collapsed"))
      this.setOpen(false);
  };

  constructor(
    private readonly store: LayoutStore,
    private readonly doc: Document,
    private readonly sync: DomSync,
  ) {}

  install(): () => void {
    const view = this.doc.defaultView;
    if (view === null) return () => {};
    this.media = view.matchMedia(`(max-width: ${BREAKPOINT}px)`);
    this.media.addEventListener("change", this.onMedia);
    this.doc.addEventListener("click", this.onDocumentClick);
    this.doc.addEventListener("keydown", this.onKeyDown);
    this.doc.addEventListener("touchstart", this.onTouchStart, {
      passive: true,
    });
    this.doc.addEventListener("touchend", this.onTouchEnd, { passive: true });
    this.frameObserver = new view.MutationObserver(this.onFrameChange);
    this.unsubscribe = this.store.subscribe(() => this.render());
    this.unregister = this.sync.register({
      onFull: () => {
        this.observeFrame();
        this.render();
      },
      onStructural: (roots) => {
        if (
          roots.some(
            (root) =>
              root.matches(FRAME_SELECTOR) ||
              root.querySelector(FRAME_SELECTOR) !== null,
          )
        ) {
          this.observeFrame();
          this.render();
        }
      },
    });
    this.render();
    return () => {
      this.dispose();
    };
  }

  dispose(): void {
    this.media?.removeEventListener("change", this.onMedia);
    this.media = undefined;
    this.doc.removeEventListener("click", this.onDocumentClick);
    this.doc.removeEventListener("keydown", this.onKeyDown);
    this.doc.removeEventListener("touchstart", this.onTouchStart);
    this.doc.removeEventListener("touchend", this.onTouchEnd);
    this.frameObserver?.disconnect();
    this.frameObserver = undefined;
    this.unregister?.();
    this.unregister = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.setOpen(false);
    this.trigger?.remove();
    this.closeButton?.remove();
    this.mask?.remove();
    this.trigger = undefined;
    this.closeButton = undefined;
    this.mask = undefined;
    this.doc.documentElement.removeAttribute("data-dsh-layout-mobile-sidebar");
  }

  /** The mode that owns THIS viewport: the narrow setting below 768px, the
      wide setting above — independent of each other. */
  private mode(): MobileSidebarMode | WideSidebarMode {
    const global = this.store.getSnapshot().global;
    return this.isMobile() ? global.narrow.sidebar : global.wide.sidebar;
  }

  private active(): boolean {
    if (this.store.getPeek()) return false;
    const mode = this.mode();
    // float: off-canvas overlay on whichever viewport configured it — a
    // fixed-width panel over the content that never reflows the content
    // column.
    if (mode === "float") return true;
    // fullscreen: phones only (< 768px), full-viewport drawer.
    return mode === "fullscreen" && this.media?.matches === true;
  }

  /** Whether the off-canvas drawer runtime currently owns the sidebar
      (fullscreen on narrow viewports, float at any width). */
  private isDrawerActive(): boolean {
    return this.doc.documentElement.hasAttribute("data-dsh-layout-mobile-sidebar");
  }

  private isMobile(): boolean {
    return this.media?.matches === true;
  }
  private isOpen(): boolean {
    return this.doc.documentElement.hasAttribute(ROOT_ATTR);
  }

  private observeFrame(): void {
    const frame = this.doc.querySelector(FRAME_SELECTOR);
    if (frame === null || this.frameObserver === undefined) return;
    this.frameObserver.disconnect();
    this.frameObserver.observe(frame, {
      attributes: true,
      attributeFilter: ["data-sidebar-collapsed"],
    });
  }

  /** DSH renders real sidebar content only in its wide state; click the
      native toggle so the drawer opens expanded (and collapses back on
      close), instead of showing the fogged collapsed rail. */
  private syncNative(expand: boolean): void {
    const frame = this.doc.querySelector(FRAME_SELECTOR);
    const toggle = this.doc.querySelector<HTMLButtonElement>(TOGGLE_SELECTOR);
    if (frame === null || toggle === null) return;
    const collapsed = frame.hasAttribute("data-sidebar-collapsed");
    if (expand && collapsed) toggle.click();
    else if (!expand && !collapsed) toggle.click();
  }

  private open(): void {
    this.syncNative(true);
    this.setOpen(true);
  }

  private close(): void {
    this.setOpen(false);
    this.syncNative(false);
  }

  private render(): void {
    const frame = this.doc.querySelector<HTMLElement>(FRAME_SELECTOR);
    const sidebar = this.doc.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
    const center = this.doc.querySelector<HTMLElement>(CENTER_SELECTOR);
    const scroll = this.doc.querySelector<HTMLElement>(SCROLL_SELECTOR);
    if (
      !this.active() ||
      frame === null ||
      sidebar === null ||
      center === null ||
      scroll === null
    ) {
      this.doc.documentElement.removeAttribute(
        "data-dsh-layout-mobile-sidebar",
      );
      this.doc.documentElement.removeAttribute("data-dsh-layout-sidebar-float");
      this.setOpen(false);
      // Full teardown of the added chrome — back to native means no leftovers.
      this.trigger?.remove();
      this.closeButton?.remove();
      this.mask?.remove();
      this.trigger = undefined;
      this.closeButton = undefined;
      this.mask = undefined;
      return;
    }
    this.doc.documentElement.setAttribute("data-dsh-layout-mobile-sidebar", "");
    this.doc.documentElement.toggleAttribute(
      "data-dsh-layout-sidebar-float",
      this.mode() === "float",
    );
    this.ensureTrigger();
    this.ensureClose();
    this.ensureMask();
  }

  private setOpen(open: boolean): void {
    const root = this.doc.documentElement;
    root.toggleAttribute(ROOT_ATTR, open && this.isDrawerActive());
    if (this.trigger !== undefined) {
      this.trigger.hidden = open;
      this.trigger.setAttribute("aria-expanded", open ? "true" : "false");
      this.trigger.setAttribute(
        "aria-label",
        open ? "关闭侧边栏" : "打开侧边栏",
      );
    }
    if (this.closeButton !== undefined) this.closeButton.hidden = !open;
    if (this.mask !== undefined) this.mask.hidden = !open;
  }

  private ensureTrigger(): HTMLButtonElement {
    if (this.trigger?.isConnected === true) return this.trigger;
    const trigger = this.doc.createElement("button");
    trigger.type = "button";
    trigger.className = "dsh-layout-mobile-sidebar-trigger";
    trigger.setAttribute("aria-controls", "dsh-layout-mobile-sidebar");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "打开侧边栏");
    /* Stock hHd-Xa_panelIcon — DSH's own sidebar toggle glyph (a panel
       with a divider rail): same visual language as the in-drawer
       toggle, read instantly as "sidebar". */
    trigger.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M9.67272 0.522841C10.8339 0.522841 11.76 0.522714 12.4963 0.602493C13.2453 0.683657 13.8789 0.854248 14.4264 1.25197C14.7504 1.48739 15.0355 1.77247 15.2709 2.0965C15.6686 2.64394 15.8392 3.27758 15.9204 4.02655C16.0002 4.7629 16 5.68895 16 6.85014V9.14986C16 10.3111 16.0002 11.2371 15.9204 11.9735C15.8392 12.7224 15.6686 13.3561 15.2709 13.9035C15.0355 14.2275 14.7504 14.5126 14.4264 14.748C13.8789 15.1458 13.2453 15.3163 12.4963 15.3975C11.76 15.4773 10.8339 15.4772 9.67272 15.4772H6.3273C5.16611 15.4772 5.24006 15.4773 3.50371 15.3975C2.75474 15.3163 2.1211 15.1458 1.57366 14.748C1.24963 14.5126 0.964549 14.2275 0.729131 13.9035C0.331407 13.3561 0.160817 12.7224 0.0796529 11.9735C-0.000126137 11.2371 1.25338e-09 10.3111 1.25338e-09 9.14986V6.85014C1.25329e-09 5.68895 -0.000126137 4.7629 0.0796529 4.02655C0.160817 3.27758 0.331407 2.64394 0.729131 2.0965C0.964549 1.77247 1.24963 1.48739 1.57366 1.25197C2.1211 0.854248 2.75474 0.683657 3.50371 0.602493C4.24006 0.522714 5.16611 0.522841 6.3273 0.522841H9.67272ZM5.54303 1.88715V14.1118C5.78636 14.1128 6.04709 14.1169 6.3273 14.1169H9.67272C10.8639 14.1169 11.7032 14.1164 12.3493 14.0465C12.9824 13.9779 13.3497 13.8494 13.6268 13.6482C13.8354 13.4966 14.0195 13.3125 14.1711 13.1039C14.3723 12.8268 14.5007 12.4595 14.5693 11.8264C14.6393 11.1803 14.6398 10.341 14.6398 9.14986V6.85014C14.6398 5.65896 14.6393 4.81967 14.5693 4.1736C14.5007 3.54048 14.3723 3.17318 14.1711 2.89609C14.0195 2.68747 13.8354 2.50337 13.6268 2.35179C13.3497 2.1506 12.9824 2.02212 12.3493 1.95353C11.7032 1.88358 10.8639 1.88307 9.67272 1.88307H6.3273C6.04709 1.88307 5.78636 1.8862 5.54303 1.88715ZM4.1828 1.91166C3.99125 1.9216 3.8148 1.93577 3.65076 1.95353C3.01764 2.02212 2.65034 2.1506 2.37325 2.35179C2.16463 2.50337 1.98052 2.68747 1.82895 2.89609C1.62776 3.17318 1.49928 3.54048 1.43069 4.1736C1.36074 4.81967 1.36023 5.65896 1.36023 6.85014V9.14986C1.36023 10.341 1.36074 11.1803 1.43069 11.8264C1.49928 12.4595 1.62776 12.8268 1.82895 13.1039C1.98052 13.3125 2.16463 13.4966 2.37325 13.6482C2.65034 13.8494 3.01764 13.9779 3.65076 14.0465C3.81478 14.0642 3.99127 14.0774 4.1828 14.0873V1.91166Z" fill="currentColor"/>' +
      "</svg>";
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      this.open();
    });
    this.doc.body.append(trigger);
    this.trigger = trigger;
    return trigger;
  }

  private ensureClose(): HTMLButtonElement {
    if (this.closeButton?.isConnected === true) return this.closeButton;
    const close = this.doc.createElement("button");
    close.type = "button";
    close.className = "dsh-layout-mobile-sidebar-close";
    close.setAttribute("aria-label", "关闭侧边栏");
    close.hidden = true;
    const glyph = this.doc.createElement("span");
    glyph.setAttribute("aria-hidden", "true");
    close.append(glyph);
    close.addEventListener("click", () => {
      this.close();
    });
    /* Mount INSIDE the drawer column: the X positions absolute against the
       drawer's top edge (aligned with the official logo row) and slides with
       the drawer during the open/close transition. */
    const sidebar = this.doc.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
    (sidebar ?? this.doc.body).append(close);
    this.closeButton = close;
    return close;
  }

  private ensureMask(): HTMLButtonElement {
    if (this.mask?.isConnected === true) return this.mask;
    const mask = this.doc.createElement("button");
    mask.type = "button";
    mask.className = "dsh-layout-mobile-sidebar-mask";
    mask.setAttribute("aria-label", "关闭侧边栏");
    mask.hidden = true;
    mask.addEventListener("click", () => {
      this.close();
    });
    this.doc.body.append(mask);
    this.mask = mask;
    return mask;
  }
}
