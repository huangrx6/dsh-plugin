import type { DomSync } from "./dom-sync.ts";

const BREAKPOINT = 767;
/** The composer's primary button — send while idle, stop while running. */
const PRIMARY_SELECTOR = "button[class*='_primary']";
/** aria-label values the primary button carries while the agent is running
    (DSH switches the same button between t("input.send") and t("input.stop")). */
const STOP_LABELS = new Set(["停止生成", "Stop generating"]);
const PILL_CLASS = "dsh-layout-busy-pill";
const TEXT_SELECTOR = "[data-dsh-layout-composer-text]";
const TOOLS_SELECTOR = "[data-dsh-layout-composer-tools]";

/** The settings scope face the runtime needs (ui-conversation namespace). */
export interface BusyEnterScope {
  subscribe(listener: () => void): () => void;
  getSnapshot(): { value?: { busyEnter?: unknown } | undefined };
}

export type BusySubmitTranslate = (key: "busyQueue" | "busySteer") => string;

/**
 * Mobile busy-submit affordance.
 *
 * DSH's「繁忙时 Enter 键行为」setting only governs the Enter KEY: on phones
 * the only gesture is tapping the primary button, which DSH turns into
 * Stop while an agent runs — queue/steer never happens, and the soft
 * keyboard's Enter is unreliable under a composing IME (keyCode 229 is
 * released as a newline). While running on a narrow viewport this runtime
 * injects a 排队/插话 pill into the composer tools row; each tap dispatches
 * a synthetic Enter keydown on the textarea so the submission routes
 * through DSH's own policy (plain Enter = the configured preference,
 * Ctrl+Enter = its opposite) — the pill just picks the gesture that yields
 * the labeled outcome under the CURRENT setting.
 */
export class BusySubmitRuntime {
  private media: MediaQueryList | undefined;
  private labelObserver: MutationObserver | undefined;
  private unsubscribe: (() => void) | undefined;
  private unregister: (() => void) | undefined;
  private readonly onMedia = (): void => {
    this.render();
  };
  private readonly onLabelChange = (): void => {
    this.observePrimary();
    this.render();
  };

  constructor(
    private readonly scope: BusyEnterScope,
    private readonly doc: Document,
    private readonly sync: DomSync,
    private readonly t: BusySubmitTranslate,
  ) {}

  install(): () => void {
    const view = this.doc.defaultView;
    if (view === null) return () => {};
    this.media = view.matchMedia(`(max-width: ${BREAKPOINT}px)`);
    this.media.addEventListener("change", this.onMedia);
    this.unsubscribe = this.scope.subscribe(() => this.render());
    this.unregister = this.sync.register({
      onFull: () => {
        this.observePrimary();
        this.render();
      },
      onStructural: (roots) => {
        if (
          roots.some(
            (root) =>
              root.matches(TOOLS_SELECTOR) ||
              root.querySelector(TOOLS_SELECTOR) !== null,
          )
        ) {
          this.observePrimary();
          this.render();
        }
      },
    });
    this.observePrimary();
    this.render();
    return () => {
      this.dispose();
    };
  }

  dispose(): void {
    this.media?.removeEventListener("change", this.onMedia);
    this.media = undefined;
    this.labelObserver?.disconnect();
    this.labelObserver = undefined;
    this.unregister?.();
    this.unregister = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.pill()?.remove();
  }

  private pill(): HTMLElement | null {
    return this.doc.querySelector(`.${PILL_CLASS}`);
  }

  private primary(): HTMLButtonElement | null {
    return this.doc.querySelector<HTMLButtonElement>(PRIMARY_SELECTOR);
  }

  /** DSH re-renders the label between 发送消息/停止生成 as running flips. */
  private observePrimary(): void {
    const view = this.doc.defaultView;
    const primary = this.primary();
    if (view === null || primary === null) return;
    this.labelObserver?.disconnect();
    this.labelObserver = new view.MutationObserver(this.onLabelChange);
    this.labelObserver.observe(primary, {
      attributes: true,
      attributeFilter: ["aria-label"],
    });
  }

  private isRunning(): boolean {
    const label = this.primary()?.getAttribute("aria-label") ?? "";
    return STOP_LABELS.has(label);
  }

  /** 'queue' (the schema default) unless the host scope says 'steer'. */
  private preferred(): "queue" | "steer" {
    return this.scope.getSnapshot().value?.busyEnter === "steer"
      ? "steer"
      : "queue";
  }

  private render(): void {
    const tools = this.doc.querySelector<HTMLElement>(TOOLS_SELECTOR);
    const show =
      this.media?.matches === true && this.isRunning() && tools !== null;
    const existing = this.pill();
    if (!show) {
      existing?.remove();
      return;
    }
    if (existing !== null && tools?.contains(existing) === true) return;
    existing?.remove();
    tools?.append(this.buildPill());
  }

  private buildPill(): HTMLElement {
    const pill = this.doc.createElement("div");
    pill.className = PILL_CLASS;
    // Gesture choice is resolved at tap time from the live setting, so a
    // settings flip needs no re-render: plain Enter follows the configured
    // preference, Ctrl+Enter performs its opposite.
    const button = (outcome: "queue" | "steer"): HTMLButtonElement => {
      const node = this.doc.createElement("button");
      node.type = "button";
      node.textContent = this.t(
        outcome === "queue" ? "busyQueue" : "busySteer",
      );
      node.addEventListener("click", () => {
        const accelerated = this.preferred() !== outcome;
        this.dispatchEnter(accelerated);
      });
      return node;
    };
    pill.append(button("queue"), button("steer"));
    return pill;
  }

  /** A synthetic Enter keydown bubbles through DSH's own composer handler
      (React delegation): isComposing:false and keyCode:0 keep it out of the
      IME-composition bail-outs that make the soft keyboard's Enter a
      newline on Chinese keyboards. */
  private dispatchEnter(accelerated: boolean): void {
    const view = this.doc.defaultView;
    const textarea = this.doc.querySelector<HTMLElement>(TEXT_SELECTOR);
    if (view === null || textarea === null) return;
    textarea.dispatchEvent(
      new view.KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
        cancelable: true,
        ctrlKey: accelerated,
      }),
    );
  }
}
