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
    '<!doctype html><html><body><div id="root"><div data-slot="root" style="display: contents"><div data-sidebar-collapsed style="grid-template-columns: 280px minmax(0, 1fr) 360px"><div id="sidebar"></div><div id="center"><header id="header"></header><div data-conversation-scroll><div id="column"><div data-slot="conversation.chat.turn" id="turn"></div></div></div></div><div id="details"></div><div data-side="sidebar"></div></div></div></div></body></html>',
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
  it("marks the frame, columns, header, chat root and message column from stable landmarks", async () => {
    const { doc, sync, shell } = setup();
    sync.install();
    shell.install();
    await flush();
    const frame = doc.querySelector('[data-slot="root"]')
      ?.firstElementChild as HTMLElement;
    expect(frame?.hasAttribute("data-dsh-layout-frame")).toBe(true);
    expect(
      doc
        .getElementById("sidebar")
        ?.hasAttribute("data-dsh-layout-sidebar-col"),
    ).toBe(true);
    expect(
      doc.getElementById("center")?.hasAttribute("data-dsh-layout-center-col"),
    ).toBe(true);
    expect(
      doc
        .getElementById("details")
        ?.hasAttribute("data-dsh-layout-details-col"),
    ).toBe(true);
    expect(
      doc
        .getElementById("header")
        ?.hasAttribute("data-dsh-layout-chrome-header"),
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

  it("preserves the live details track in --dsh-layout-details", async () => {
    const { doc, sync, shell } = setup();
    sync.install();
    shell.install();
    await flush();
    const frame = doc.querySelector('[data-slot="root"]')
      ?.firstElementChild as HTMLElement;
    expect(frame?.style.getPropertyValue("--dsh-layout-details")).toBe("360px");
  });

  it("uses rendering quality as the single blur policy", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install(); shell.install(); await flush();
    store.update({ global: { ...store.getSnapshot().global, quality: 'performance' } });
    expect(doc.documentElement.dataset.dshLayoutQuality).toBe('performance');
    expect(doc.documentElement.hasAttribute('data-dsh-layout-fluid')).toBe(true);
  });

  it("pushes glass materials as data switches and CSS variables", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({ sidebar: { glass: { enabled: true, tint: "#112233", opacity: 60, blur: 20, saturation: 170 }, divider: "native", width: null, paddingX: null, paddingY: null, rowHeight: null, rowGap: null, scrollbar: "native" } });
    expect(doc.documentElement.dataset.dshLayoutSidebar).toBe("glass");
    expect(doc.documentElement.style.getPropertyValue("--dsh-glass-sidebar")).toContain("#112233");
    expect(doc.documentElement.style.getPropertyValue("--dsh-glass-sidebar-blur")).toBe("20px");
    expect(doc.documentElement.dataset.dshLayoutHeader).toBe(undefined);
    expect(doc.documentElement.style.getPropertyValue("--dsh-glass-header")).toBe("");
    store.update({ sidebar: { glass: { enabled: false, tint: "", opacity: 72, blur: 16, saturation: 120 }, divider: "hidden", width: null, paddingX: null, paddingY: null, rowHeight: null, rowGap: null, scrollbar: "native" } });
    expect(doc.documentElement.dataset.dshLayoutSidebarDivider).toBe("hidden");
    expect(doc.documentElement.dataset.dshLayoutSidebar).toBe("native");
    expect(doc.documentElement.style.getPropertyValue("--dsh-glass-sidebar")).toBe("");
  });

  it("leaves the header unpainted — one sheet owns header and conversation", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({ content: { ...store.getSnapshot().content, glass: { enabled: true, tint: "", opacity: 72, blur: 16, saturation: 120 } } });
    expect(doc.documentElement.dataset.dshLayoutContent).toBe("glass");
    // A second header sheet would double the tint and the top strip would no
    // longer match the conversation area — the header must not paint at all.
    expect(doc.documentElement.dataset.dshLayoutHeader).toBe(undefined);
    expect(doc.documentElement.style.getPropertyValue("--dsh-glass-header")).toBe("");
    store.update({ content: { ...store.getSnapshot().content, glass: { enabled: false, tint: "", opacity: 72, blur: 16, saturation: 120 } } });
    expect(doc.documentElement.dataset.dshLayoutContent).toBe("native");
  });

  it("toggles the background attribute by mode and pushes radius/width/density/scale", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({ global: { ...store.getSnapshot().global, background: { mode: "color", color: "#f4f6f9", imageUrl: "", videoUrl: "" } } });
    expect(doc.documentElement.hasAttribute("data-dsh-layout-bg")).toBe(true);
    store.update({ global: { ...store.getSnapshot().global, radius: 12, background: { mode: "native", color: "#f4f6f9", imageUrl: "", videoUrl: "" } } });
    expect(doc.documentElement.hasAttribute("data-dsh-layout-bg")).toBe(false);
    expect(doc.documentElement.hasAttribute("data-dsh-layout-radius")).toBe(true);
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-radius-user")).toBe("12px");
    store.update({ content: { ...store.getSnapshot().content, width: 900, density: 24, scale: 110 } });
    expect(doc.documentElement.dataset.dshLayoutReadWidth).toBe("custom");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-read-width")).toBe("900px");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-density")).toBe("24px");
    expect(doc.documentElement.style.getPropertyValue("--dsh-layout-scale")).toBe("110%");
  });

  it("marks the composer width only when the content measure is full, and clears everything while peeking", async () => {
    const { doc, sync, shell, store } = setup();
    sync.install();
    shell.install();
    await flush();
    store.update({ content: { ...store.getSnapshot().content, width: "full" } });
    await flush();
    const chatRoot = doc.querySelector("[data-dsh-layout-chat-root]") as HTMLElement;
    expect(chatRoot?.getAttribute("data-dsh-layout-composer-width")).toBe("full");
    store.setPeek(true);
    await flush();
    expect(chatRoot?.hasAttribute("data-dsh-layout-composer-width")).toBe(false);
    expect(doc.documentElement.dataset.dshLayoutFooter).toBe(undefined);
    store.setPeek(false);
    await flush();
    expect(chatRoot?.getAttribute("data-dsh-layout-composer-width")).toBe("full");
    store.update({ content: { ...store.getSnapshot().content, width: "native" } });
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

  it("removes every marker and the details var on dispose", async () => {
    const { doc, sync, shell } = setup();
    sync.install();
    const dispose = shell.install();
    await flush();
    dispose();
    const frame = doc.querySelector('[data-slot="root"]')
      ?.firstElementChild as HTMLElement;
    expect(frame?.hasAttribute("data-dsh-layout-frame")).toBe(false);
    expect(frame?.style.getPropertyValue("--dsh-layout-details")).toBe("");
  });
});
