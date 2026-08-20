import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { ConnectionHandle } from "@deepseek-ai/dsh-client-connection/client";
import "@deepseek-ai/dsh-client-connection/client";
import "@deepseek-ai/dsh-client-locale/client";
import type {} from "@deepseek-ai/dsh-client-ui-conversation/client";
import "@deepseek-ai/dsh-client-ui-settings/client";
import type { LayoutLocaleKey } from "./locales.ts";
import { enUS, LAYOUT_NS, zhCN } from "./locales.ts";
import { LayoutSettingsSection } from "./LayoutSettings.tsx";
import { DockStats, ToolbarStats } from "./StatsPanel.tsx";
import { BusySubmitRuntime, type BusyEnterScope } from "./busy-submit.ts";
import { LayoutStore } from "./store.ts";
import { DomSync } from "./dom-sync.ts";
import { OriginalStatsSuppressor } from "./suppressor.ts";
import { installStyles } from "./styles.ts";
import { ComposerWorkbench } from "./workbench.ts";
import { BackgroundRuntime } from "./background.ts";
import { MobileSidebarRuntime } from "./mobile-sidebar.ts";
import { SettingsTopbarRuntime } from "./settings-topbar.ts";
import { ShellRuntime } from "./shell.ts";
import { ComposerFocusGuard } from "./composer-focus.ts";
import { installMenuClamp } from "./menu-clamp.ts";
import { installMenuOverflow } from "./menu-overflow.ts";
import { DshLayoutClient } from "./persistence.ts";

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    layout: LayoutLocaleKey;
  }
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher full-screen
        workspace; registering under id 'layout' replaces the launcher's
        default placeholder for the 页面布局 entry. */
    "dsh-launcher.workspace.section": {
      kind: "list";
      scope: "root";
      owner: object;
    };
  }
}

export const inject = ["slots", "locale", "connection", "remote", "settingsScope"];

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle })
    .connection;
  const persistence = new DshLayoutClient(connection.rpc);
  // The profile file is the source of truth. Do not resurrect old browser-only
  // layout/surface keys when the unified plugin is installed for the first time.
  const store = new LayoutStore(undefined, (settings) => {
    void persistence
      .save(settings)
      .catch((error) => console.error("dsh-layout could not be saved:", error));
  });
  const sync = new DomSync(document);
  const suppressor = new OriginalStatsSuppressor(store, document, sync);
  const workbench = new ComposerWorkbench(store, document, sync);
  const background = new BackgroundRuntime(store, document);
  const shell = new ShellRuntime(store, document, sync);
  const mobileSidebar = new MobileSidebarRuntime(store, document, sync);
  const settingsTopbar = new SettingsTopbarRuntime(document, sync);
  const composerFocus = new ComposerFocusGuard(document);

  ctx.effect(
    () => ctx.locale.register(LAYOUT_NS, { zh: zhCN, en: enUS }),
    "layout: dictionaries",
  );
  const t = ctx.locale.bind(LAYOUT_NS);
  // The busy-Enter preference lives in the conversation plugin's settings
  // namespace; the scope service binds it to OUR lifecycle.
  const busyScope = (ctx as unknown as {
    settingsScope: { bind(spec: { namespace: string }): BusyEnterScope };
  }).settingsScope.bind({ namespace: "ui-conversation" });
  const busySubmit = new BusySubmitRuntime(busyScope, document, sync, t);

  ctx.effect(() => installStyles(document), "dsh-layout: styles");
  ctx.effect(() => background.install(), "dsh-layout: background");
  ctx.effect(() => shell.install(), "dsh-layout: shell");
  void persistence
    .load()
    .then((settings) => {
      if (settings !== undefined) store.hydrate(settings);
    })
    .catch((error) =>
      console.error("dsh-layout could not load file settings:", error),
    );
  // One shared MutationObserver drives every DOM pass; order matters:
  // the shell marks the frame first, then the workbench marks the composer.
  ctx.effect(() => sync.install(), "dsh-layout: dom sync");
  ctx.effect(() => workbench.install(), "dsh-layout: composer workbench");
  ctx.effect(() => mobileSidebar.install(), "dsh-layout: mobile sidebar");
  ctx.effect(() => settingsTopbar.install(), "dsh-layout: settings topbar");
  ctx.effect(
    () => composerFocus.install(),
    "dsh-layout: composer focus guard",
  );
  ctx.effect(() => busySubmit.install(), "dsh-layout: busy submit");
  ctx.effect(() => installMenuClamp(document), "dsh-layout: menu clamp");
  ctx.effect(
    () => installMenuOverflow(document),
    "dsh-layout: header overflow menu",
  );
  ctx.effect(
    () => suppressor.install(),
    "dsh-layout: original stats suppression",
  );

  ctx.slots.inject("conversation.input.right", () =>
    ctx.slots.register(
      {
        name: "conversation.input.right",
        id: "dsh-layout-toolbar",
        order: 80,
        locale: LAYOUT_NS,
        inject: () => ({ store }),
      },
      ToolbarStats,
    ),
  );

  ctx.slots.inject("conversation.composer.dock", () =>
    ctx.slots.register(
      {
        name: "conversation.composer.dock",
        id: "dsh-layout-dock",
        order: 80,
        locale: LAYOUT_NS,
        inject: () => ({ store }),
      },
      DockStats,
    ),
  );

  // Launcher workspace section: the dsh-launcher plugin renders our
  // LayoutSettingsSection inside its full-screen workspace when the user
  // picks the 页面布局 entry; the launcher's placeholder for id 'layout'
  // is replaced by this registration. (The former settings.section nav
  // entry moved here when the workspace became the home for all plugin
  // sections.)
  ctx.slots.inject("dsh-launcher.workspace.section", () =>
    ctx.slots.register(
      {
        name: "dsh-launcher.workspace.section",
        id: "layout",
        order: 46,
        label: () => t("section"),
        locale: LAYOUT_NS,
        inject: () => ({ store }),
      },
      LayoutSettingsSection,
    ),
  );
}

export { LayoutSettingsSection };
