import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { ConnectionHandle } from "@deepseek-ai/dsh-client-connection/client";
import "@deepseek-ai/dsh-client-connection/client";
import "@deepseek-ai/dsh-client-locale/client";
import "@deepseek-ai/dsh-client-ui-settings/client";
import type { McpManagerLocaleKey } from "./locales.ts";
import { enUS, MCP_MANAGER_NS, zhCN } from "./locales.ts";
import { McpManagerApi } from "./api.ts";
import { McpManagerSection } from "./McpManagerSection.tsx";
import { McpMarketSection } from "./McpMarketSection.tsx";
import { installStyles } from "./styles.ts";

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    "settings.mcpManager": McpManagerLocaleKey;
  }
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher full-screen
        workspace. The plugin registers under id 'mcp' so the launcher's
        default placeholder is replaced with our McpMarketSection. */
    "dsh-launcher.workspace.section": {
      kind: "list";
      scope: "root";
      owner: object;
    };
  }
}

export const inject = ["slots", "locale", "connection"];

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle })
    .connection;
  const api = new McpManagerApi(connection.rpc);

  ctx.effect(
    () => ctx.locale.register(MCP_MANAGER_NS, { zh: zhCN, en: enUS }),
    "dsh-mcp-manager: dictionaries",
  );
  const t = ctx.locale.bind(MCP_MANAGER_NS);

  ctx.effect(() => installStyles(document), "dsh-mcp-manager: styles");

  // Launcher workspace section: the dsh-launcher plugin renders our
  // McpMarketSection inside its full-screen workspace when the user picks
  // the "MCP" entry. The launcher registers the slot
  // `dsh-launcher.workspace.section`; we override the default placeholder
  // for `id: 'mcp'` with the marketplace shelf wired to our API.
  // (This is the plugin's only nav entry — the former settings.section
  // registration moved here when the workspace became the home for all
  // plugin sections.)
  const launcherT = ctx.locale.bind("dsh-launcher");
  ctx.slots.inject("dsh-launcher.workspace.section", () =>
    ctx.slots.register(
      {
        name: "dsh-launcher.workspace.section",
        id: "mcp",
        order: 51,
        label: () => t("marketTab"),
        locale: MCP_MANAGER_NS,
        inject: () => ({ api, t, launcherT }),
      },
      McpMarketSection,
    ),
  );
}

export { McpManagerSection, McpMarketSection };
