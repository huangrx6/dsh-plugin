/**
 * Smoke tests for the launcher's DOM event bus. The bus is the only
 * coordination channel between the best-effort side-rail button (plain
 * DOM, no React) and the shell.overlay entry (LauncherHost) — a broken
 * bus means clicks do nothing, so the round-trip is worth pinning.
 */
import { describe, expect, it, vi } from "vitest";
import { emit, on, LauncherEvents } from "../src/client/events.ts";

/** The bus only needs the EventTarget face of a Document; Node's bare
    EventTarget + global CustomEvent cover that for tests. */
function fakeDocument(): Document {
  return new EventTarget() as unknown as Document;
}

describe("launcher event bus", () => {
  it("round-trips a PanelOpen event with no detail", () => {
    const handler = vi.fn();
    const doc = fakeDocument();
    const off = on(doc, LauncherEvents.PanelOpen, handler);
    emit(doc, LauncherEvents.PanelOpen);
    expect(handler).toHaveBeenCalledOnce();
    off();
  });

  it("carries detail payloads through WorkspaceNavigate", () => {
    const handler = vi.fn();
    const doc = fakeDocument();
    const off = on(doc, LauncherEvents.WorkspaceNavigate, handler);
    emit(doc, LauncherEvents.WorkspaceNavigate, { id: "skills" });
    expect(handler).toHaveBeenCalledOnce();
    const event = handler.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toEqual({ id: "skills" });
    off();
  });

  it("stops delivering after the disposer runs", () => {
    const handler = vi.fn();
    const doc = fakeDocument();
    const off = on(doc, LauncherEvents.WorkspaceClose, handler);
    off();
    emit(doc, LauncherEvents.WorkspaceClose);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not deliver events of other names", () => {
    const handler = vi.fn();
    const doc = fakeDocument();
    const off = on(doc, LauncherEvents.WorkspaceOpen, handler);
    emit(doc, LauncherEvents.PanelClose);
    expect(handler).not.toHaveBeenCalled();
    off();
  });
});
