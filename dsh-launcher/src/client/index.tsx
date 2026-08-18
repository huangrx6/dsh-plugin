/**
 * dsh-launcher client entry.
 *
 * Two mounts, zero own React roots:
 *
 *   1. A shell.overlay slot entry (LauncherHost). The platform renders
 *      our whole visual tree — FAB, launcher panel, workspace canvas —
 *      with its own React, because the ModuleLoader's seed table only
 *      resolves `react` and whitelisted @deepseek-ai/* packages
 *      (react-dom/client is NOT resolvable from a plugin bundle).
 *      The entry also DECLARES the child slot
 *      'dsh-launcher.workspace.section', which is what makes the
 *      framework's renderSlot legal for the workspace body.
 *
 *   2. A best-effort side-rail button (plain DOM injection): if the rail
 *      and the native settings trigger are found, a small button joins
 *      them. It only emits a DOM event; all rendering lives in (1).
 */
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import "@deepseek-ai/dsh-client-locale/client";
import { installStyles } from "./styles.ts";
import {
  enUS,
  LAUNCHER_NS,
  zhCN,
  type LauncherLocaleKey,
} from "./locales.ts";
import { LauncherHost } from "./LauncherHost.tsx";
import type { SlotRegistryLike } from "./WorkspaceOverlay.tsx";
import { installRailButton } from "./rail-button.ts";

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    "dsh-launcher": LauncherLocaleKey;
  }
  interface SlotMap {
    /** Full-screen surfaces floating over the whole app. Declared by the
        platform's ui-layout package (which our bundle cannot see — it
        isn't in the client inject whitelist), so we re-declare the
        contract here to make `slots.inject('shell.overlay', …)` typed.
        Shape mirrors the platform's own declaration: list + root scope,
        additive coexisting entries, click-through until an entry opts
        into pointer events. */
    "shell.overlay": {
      kind: "list";
      scope: "root";
      owner: object;
    };
    /** Workspace sections contributed by other plugins. Declared by THIS
        entry via register's `children`, which authorizes the framework
        renderSlot call the workspace body makes. */
    "dsh-launcher.workspace.section": {
      kind: "list";
      scope: "root";
      owner: object;
    };
  }
}

export const inject = ["slots", "locale"] as const;

export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => installStyles(document),
    "dsh-launcher: styles",
  );
  ctx.effect(
    () => ctx.locale.register(LAUNCHER_NS, { zh: zhCN, en: enUS }),
    "dsh-launcher: dictionaries",
  );

  const slotsView = ctx.slots as unknown as SlotRegistryLike;

  // Best-effort side-rail button: plain DOM, no React. Silent when the
  // rail / native trigger can't be found — the FAB is the guaranteed
  // entry point.
  ctx.effect(
    () => installRailButton(document),
    "dsh-launcher: rail button",
  );

  // The one render entry. `children` declares (and thereby authorizes)
  // 'dsh-launcher.workspace.section' for the duration of this
  // registration; the host passes its renderSlot down to the workspace
  // body, so plugin sections render through the framework machinery.
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-launcher",
        order: 100,
        locale: LAUNCHER_NS,
        children: {
          "dsh-launcher.workspace.section": {
            kind: "list",
            scope: "root",
          },
        },
        inject: () => ({ slotsView }),
      },
      LauncherHost,
    ),
  );
}
