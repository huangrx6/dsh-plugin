import { describe, expect, it } from "vitest";
// Minimal typing: the suite only constructs JSDOM and reads window/document.
const { JSDOM } = require("jsdom") as {
  JSDOM: new (
    html: string,
    options?: { url?: string },
  ) => { window: Window & typeof globalThis };
};
import { DomSync } from "../src/client/dom-sync.ts";
import { ShellRuntime } from "../src/client/shell.ts";
import { LayoutStore } from "../src/client/store.ts";

interface World {
  doc: Document;
  sync: DomSync;
  shell: ShellRuntime;
  store: LayoutStore;
}

/** Builds a DOM shaped like the DSH shell: root slot → frame with three
 * columns, and a conversation root containing the header + scroller + turns. */
function setup(): World {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"><div data-slot="root" style="display: contents"><div data-sidebar-collapsed style="grid-template-columns: 280px minmax(0, 1fr) 360px"><div id="sidebar"><div><div role="tree" id="list"></div></div></div><div id="center"><header id="header"></header><div data-conversation-scroll><div id="column"><div data-slot="conversation.chat.turn" id="turn"></div></div></div></div><div id="details"></div><div data-side="sidebar"></div></div></div></div></body></html>',
    { url: "https://dsh-layout.test/" },
  );
  const doc = dom.window.document;
  const sync = new DomSync(doc);
  const store = new LayoutStore();
  const shell = new ShellRuntime(store, doc, sync);
  return { doc, sync, shell, store };
}

async function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

describe("ShellRuntime", () => {
  it("marks the frame, columns, chat root and message column from stable landmarks", async () => {
    const { doc, sync, shell } = setup();
    sync.install();
    shell.install();
    await flush();
    const frame = doc.querySelector('[data-slot="root"]')
      ?.firstElementChild as HTMLElement;
    expect(frame?.hasAttribute("data-dsh-layout-frame")).toBe(true);
    expect(
      doc.getElementById("sidebar")?.hasAttribute("data-dsh-layout-sidebar-col"),
    ).toBe(true);
    expect(
      doc.getElementById("list")?.hasAttribute("data-dsh-layout-sidebar-list"),
    ).toBe(true);
    expect(
      doc.getElementById("center")?.hasAttribute("data-dsh-layout-center-col"),
    ).toBe(true);
    expect(
      doc.getElementById("header")?.hasAttribute("data-dsh-layout-chrome-header"),
    ).toBe(true);
    expect(
      doc
        .querySelector("[data-conversation-scroll]")
        ?.parentElement?.hasAttribute("data-dsh-layout-chat-root"),
    ).toBe(true);
    expect(
      doc.getElementById("column")?.hasAttribute("data-dsh-layout-chat-column"),
    ).toBe(true);
  });

  it("pushes global radius/background/dialog/padding/narrow as switches and variables", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    expect(doc.documentElement.hasAttribute("data-dsh-layout-bg")).toBe(false);
    expect(doc.documentElement.hasAttribute("data-dsh-layout-narrow-wrap")).toBe(true);
    store.update({
      global: {
        ...store.getSnapshot().global,
        radius: 12,
        background: { mode: "color", color: "#f4f6f9", imageUrl: "", videoUrl: "" },
        dialog: { width: 1000, height: 880 },
        padding: { mode: "custom", header: { left: 16, right: 24 }, content: { left: null, right: null }, composer: { left: null, right: null } },
      },
    });
    expect(doc.documentElement.hasAttribute("data-dsh-layout-bg")).toBe(true);
    expect(doc.documentElement.hasAttribute("data-dsh-layout-radius")).toBe(true);
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-radius-user")).toBe("12px");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-ring-mask")).toContain("data:image/svg+xml");
    expect(doc.documentElement.getAttribute("data-dsh-layout-dialog")).toBe("");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-dialog-width")).toBe("1000px");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-pad-header-start")).toBe("16px");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-pad-header-end")).toBe("24px");
    store.update({ global: { ...store.getSnapshot().global, radius: null, background: { mode: "native", color: "#f4f6f9", imageUrl: "", videoUrl: "" }, dialog: { width: null, height: null }, padding: { ...store.getSnapshot().global.padding, mode: "auto" } } });
    expect(doc.documentElement.hasAttribute("data-dsh-layout-bg")).toBe(false);
    expect(doc.documentElement.hasAttribute("data-dsh-layout-radius")).toBe(false);
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-radius-user")).toBe("");
    expect(doc.documentElement.hasAttribute("data-dsh-layout-dialog")).toBe(false);
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-pad-header-start")).toBe("");
  });

  it("pushes the one page material as a switch and CSS variables", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    expect(doc.documentElement.dataset.dshLayoutMaterial).toBe("off");
    store.update({ material: { enabled: true, opacity: 72, blur: 26, saturation: 130 } });
    expect(doc.documentElement.dataset.dshLayoutMaterial).toBe("on");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-mat")).toBe(
      "color-mix(in srgb, var(--dsh-layout-glass-base) 72%, transparent)",
    );
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-mat-blur")).toBe("26px");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-mat-sat")).toBe("130%");
    store.update({ material: { enabled: false, opacity: 72, blur: 26, saturation: 130 } });
    expect(doc.documentElement.dataset.dshLayoutMaterial).toBe("off");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-mat")).toBe("");
  });

  it("pushes scrollbar, scroll end, bubbles, trace and reading width as datasets", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({
      global: { ...store.getSnapshot().global, scrollbar: "hidden" },
      conversation: {
        ...store.getSnapshot().conversation,
        scrollEnd: "above",
        bubble: "glass",
        width: "full",
        trace: { background: "clear", width: "inset", tableTail: "none" },
      },
    });
    expect(doc.documentElement.dataset.dshLayoutScrollbar).toBe("hidden");
    expect(doc.documentElement.dataset.dshLayoutScrollEnd).toBe("above");
    expect(doc.documentElement.dataset.dshLayoutBubble).toBe("glass");
    expect(doc.documentElement.dataset.dshLayoutTraceBg).toBe("clear");
    expect(doc.documentElement.dataset.dshLayoutTraceWidth).toBe("inset");
    expect(doc.documentElement.dataset.dshLayoutTraceTail).toBe("none");
    expect(doc.documentElement.dataset.dshLayoutReadWidth).toBe("full");
  });

  it("toggles input rows as an attribute plus variable, null stays native", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({ conversation: { ...store.getSnapshot().conversation, inputRows: 4 } });
    expect(doc.documentElement.hasAttribute("data-dsh-layout-input-rows")).toBe(true);
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-input-rows")).toBe("4");
    store.update({ conversation: { ...store.getSnapshot().conversation, inputRows: null } });
    expect(doc.documentElement.hasAttribute("data-dsh-layout-input-rows")).toBe(false);
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-input-rows")).toBe("");
  });

  it("marks the composer width only when the reading width is full, and clears everything while peeking", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({ conversation: { ...store.getSnapshot().conversation, width: "full" } });
    await flush();
    const chatRoot = doc.querySelector("[data-dsh-layout-chat-root]") as HTMLElement;
    expect(chatRoot?.getAttribute("data-dsh-layout-composer-width")).toBe("full");
    store.setPeek(true);
    await flush();
    expect(chatRoot?.hasAttribute("data-dsh-layout-composer-width")).toBe(false);
    expect(doc.documentElement.dataset.dshLayoutMaterial).toBe(undefined);
    store.setPeek(false);
    await flush();
    expect(chatRoot?.getAttribute("data-dsh-layout-composer-width")).toBe("full");
    store.update({ conversation: { ...store.getSnapshot().conversation, width: "native" } });
    await flush();
    expect(chatRoot?.hasAttribute("data-dsh-layout-composer-width")).toBe(false);
  });

  it("re-remarks without rewriting markers — no steady-state DOM churn", async () => {
    const { doc, sync, shell } = setup();
    sync.install();
    shell.install();
    await flush();
    // Watch every attribute write, including our own data markers.
    const view = doc.defaultView as Window & typeof globalThis;
    const records: MutationRecord[] = [];
    const observer = new view.MutationObserver(list => { records.push(...list); });
    observer.observe(doc.documentElement, { subtree: true, attributes: true });
    // A structural change (another turn mounts) re-runs the whole remark pass.
    const turn = doc.getElementById("turn") as HTMLElement;
    const clone = turn.cloneNode(false) as HTMLElement;
    // A freshly mounted DSH node carries no plugin marks or ids.
    clone.removeAttribute("id");
    clone.removeAttribute("data-dsh-layout-chat-column");
    turn.parentElement?.appendChild(clone);
    await flush();
    await flush();
    const ours = records.filter(record =>
      (record.attributeName ?? "").startsWith("data-dsh-layout"),
    );
    // The old clear-then-repaint cycle produced ~10 attribute records per
    // flush (DevTools flicker); idempotent marking produces none.
    expect(ours).toEqual([]);
    observer.disconnect();
  });

  it("removes every marker on dispose", async () => {
    const { doc, sync, shell } = setup();
    sync.install();
    const dispose = shell.install();
    await flush();
    dispose();
    const frame = doc.querySelector('[data-slot="root"]')
      ?.firstElementChild as HTMLElement;
    expect(frame?.hasAttribute("data-dsh-layout-frame")).toBe(false);
    expect(doc.querySelectorAll("[data-dsh-layout-chat-root], [data-dsh-layout-sidebar-col], [data-dsh-layout-center-col], [data-dsh-layout-chrome-header], [data-dsh-layout-chat-column]").length).toBe(0);
  });
});
