import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { ConnectionHandle } from "@deepseek-ai/dsh-client-connection/client";
import "@deepseek-ai/dsh-client-connection/client";
import "@deepseek-ai/dsh-client-locale/client";
import "@deepseek-ai/dsh-client-ui-settings/client";
import type { SkillManagerLocaleKey } from "./locales.ts";
import { enUS, SKILL_MANAGER_NS, zhCN } from "./locales.ts";
import { SkillManagerApi } from "./api.ts";
import { SkillManagerSection } from "./SkillManagerSection.tsx";
import { SkillMarketSection } from "./SkillMarketSection.tsx";
import { installStyles } from "./styles.ts";

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    "settings.skillManager": SkillManagerLocaleKey;
  }
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher full-screen
        workspace. The plugin registers under id 'skills' so the launcher's
        default placeholder is replaced with our SkillMarketSection. */
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
  const api = new SkillManagerApi(connection.rpc);

  ctx.effect(
    () => ctx.locale.register(SKILL_MANAGER_NS, { zh: zhCN, en: enUS }),
    "dsh-skill-manager: dictionaries",
  );
  const t = ctx.locale.bind(SKILL_MANAGER_NS);

  ctx.effect(() => installStyles(document), "dsh-skill-manager: styles");

  // Launcher workspace section: the dsh-launcher plugin renders our
  // SkillMarketSection inside its full-screen workspace when the user
  // picks the "Skills" entry. The launcher registers the slot
  // `dsh-launcher.workspace.section`; we override the default placeholder
  // for `id: 'skills'` with the marketplace shelf wired to our API.
  // (This is the plugin's only nav entry — the former settings.section
  // registration moved here when the workspace became the home for all
  // plugin sections.)
  const launcherT = ctx.locale.bind("dsh-launcher");
  ctx.slots.inject("dsh-launcher.workspace.section", () =>
    ctx.slots.register(
      {
        name: "dsh-launcher.workspace.section",
        id: "skills",
        order: 50,
        label: () => t("sectionLabel"),
        locale: SKILL_MANAGER_NS,
        inject: () => ({ api, t, launcherT }),
      },
      SkillMarketSection,
    ),
  );
}

export { SkillManagerSection, SkillMarketSection };
