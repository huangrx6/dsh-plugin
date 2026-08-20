/**
 * Workspace view — the full-screen canvas the launcher panel's
 * "Personal workspace" entry opens. Rendered inline by LauncherHost
 * (the shell.overlay entry); no portals, no own React root.
 *
 * Layout: a top bar (title + close), a left menu (a horizontal tab bar
 * on H5) listing the launcher's default sections plus any plugin
 * contributions, and a content area. Section content prefers the
 * framework's renderSlot (so plugin entries render with the platform's
 * own React and receive their injected props); entries whose component
 * we can't dispatch that way fall back to mounting the component
 * directly from the slot ledger.
 *
 * The section contract: plugins register to
 * 'dsh-launcher.workspace.section' with id 'skills' | 'mcp' | ... —
 * matching ids REPLACE the launcher's placeholder for that section.
 *
 * Section ordering, grouping, and labels are driven by metadata from
 * the host-side RPC (launcher-sections.json), falling back to the
 * built-in defaults when the RPC is unavailable.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { PropsRenderSlots } from "@deepseek-ai/dsh-client-ui-slots";
import type { SectionMetadata } from "../contracts.ts";
import {
  IconArchive,
  IconChevronDown,
  IconClose,
  IconGrid,
  IconLayout,
  IconMcp,
  IconRemote,
  IconRules,
  IconGauge,
  IconSkills,
  IconSparkle,
} from "./icons.tsx";
import type { LauncherLocaleKey } from "./locales.ts";

export interface WorkspaceSection {
  /** Stable id — the workspace persists this across renders. */
  readonly id: string;
  /** Resolved display label (already localized). */
  readonly label: string;
  /** Resolved subtitle (already localized). undefined when absent. */
  readonly subtitle: string | undefined;
  /** Locale key of the nav group this section lives under. */
  readonly groupKey: LauncherLocaleKey;
  /** Menu priority for ordering (lower = higher). */
  readonly menuPriority: number;
  /** Inline icon (a ReactElement). */
  readonly icon: JSX.Element;
  /** Section renderer. Defaults to the placeholder; replaced by slot
      contributions matching the id. */
  readonly render: () => JSX.Element;
}

/** Minimal slot-ledger view the workspace needs (narrowed so the runtime
    SlotRegistry can be passed without further casts). */
export interface SlotRegistryLike {
  readonly entries: (key: string) => readonly SlotEntryView[];
  readonly subscribe: (key: string, cb: () => void) => () => void;
}

export interface SlotEntryView {
  readonly component: unknown;
  readonly options: {
    readonly id?: string;
    readonly order?: number;
    readonly label?: string | (() => string);
  };
}

/** RPC API for fetching section metadata from the host. */
export interface LauncherSectionsApi {
  readonly callSectionsRpc: () => Promise<{
    readonly ok: boolean;
    readonly value?: { readonly sections: readonly SectionMetadata[] };
    readonly error?: { readonly code: string; readonly message: string };
  }>;
}

export const WORKSPACE_SECTION_SLOT = "dsh-launcher.workspace.section";

// ─── Fallback icon + locale key map (used when RPC is unavailable) ──

interface FallbackEntry {
  readonly icon: JSX.Element;
  readonly labelKey: LauncherLocaleKey;
  readonly subtitleKey?: LauncherLocaleKey;
  readonly groupKey: LauncherLocaleKey;
  readonly menuPriority: number;
}

const FALLBACK_BY_ID: Record<string, FallbackEntry> = {
  rules: {
    icon: <IconRules size={20} />,
    labelKey: "menuAgentRules",
    subtitleKey: "menuAgentRulesSubtitle",
    groupKey: "menuGroupAgentRules",
    menuPriority: 1,
  },
  usage: {
    icon: <IconGauge size={20} />,
    labelKey: "menuUsage",
    subtitleKey: "menuUsageSubtitle",
    groupKey: "menuGroupManage",
    menuPriority: 2,
  },
  layout: {
    icon: <IconLayout size={20} />,
    labelKey: "menuLayout",
    subtitleKey: "menuLayoutSubtitle",
    groupKey: "menuGroupAppearance",
    menuPriority: 3,
  },
  skills: {
    icon: <IconSkills size={20} />,
    labelKey: "menuSkills",
    subtitleKey: "menuSkillsSubtitle",
    groupKey: "menuGroupManage",
    menuPriority: 4,
  },
  mcp: {
    icon: <IconMcp size={20} />,
    labelKey: "menuMcp",
    subtitleKey: "menuMcpSubtitle",
    groupKey: "menuGroupManage",
    menuPriority: 5,
  },
  remote: {
    icon: <IconRemote size={20} />,
    labelKey: "menuRemote",
    subtitleKey: "menuRemoteSubtitle",
    groupKey: "menuGroupTools",
    menuPriority: 6,
  },
  archive: {
    icon: <IconArchive size={20} />,
    labelKey: "menuArchive",
    subtitleKey: "menuArchiveSubtitle",
    groupKey: "menuGroupTools",
    menuPriority: 7,
  },
};

/** Build default sections with labels resolved via the locale `t` function. */
function buildDefaultSections(
  t: (key: LauncherLocaleKey) => string,
): readonly WorkspaceSection[] {
  return Object.entries(FALLBACK_BY_ID)
    .sort(([, a], [, b]) => a.menuPriority - b.menuPriority)
    .map(([id, fb]) => ({
      id,
      label: t(fb.labelKey),
      subtitle: fb.subtitleKey !== undefined ? t(fb.subtitleKey) : undefined,
      groupKey: fb.groupKey,
      menuPriority: fb.menuPriority,
      icon: fb.icon,
      render: () => <SectionPlaceholder id={id} />,
    }));
}

/** Map host-side menuGroup values to locale keys for the group header. */
const GROUP_KEY_MAP: Record<string, LauncherLocaleKey> = {
  agent: "menuGroupAgentRules",
  manage: "menuGroupManage",
  appearance: "menuGroupAppearance",
  tools: "menuGroupTools",
};

function resolveGroupKey(menuGroup: string): LauncherLocaleKey {
  return GROUP_KEY_MAP[menuGroup] ?? "menuGroupTools";
}

export interface WorkspaceViewProps {
  readonly t: (key: LauncherLocaleKey) => string;
  readonly document: Document;
  readonly slotsView: SlotRegistryLike;
  readonly sectionsApi: LauncherSectionsApi;
  readonly renderSlot?:
    | PropsRenderSlots<"dsh-launcher.workspace.section">["renderSlot"]
    | undefined;
  readonly onClose: () => void;
}

export function WorkspaceView({
  t,
  document,
  slotsView,
  sectionsApi,
  renderSlot,
  onClose,
}: WorkspaceViewProps): JSX.Element {
  const [activeId, setActiveId] = useState<string>("");
  const [closing, setClosing] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  // H5 collapsible menu: the tab grid folds into a one-line toggle on
  // phones; selecting a section (or toggling) closes it again.
  const [menuOpen, setMenuOpen] = useState(false);
  const [metaSections, setMetaSections] = useState<readonly WorkspaceSection[]>(
    () => buildDefaultSections(t),
  );

  // Fetch section metadata from the host on mount.
  useEffect(() => {
    let cancelled = false;
    sectionsApi
      .callSectionsRpc()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok || result.value === undefined) return;
        const mapped = result.value.sections.map<WorkspaceSection>((meta) => {
          const fb = FALLBACK_BY_ID[meta.id];
          return {
            id: meta.id,
            label: meta.zh.name,
            subtitle: meta.zh.desc,
            groupKey: resolveGroupKey(meta.menuGroup),
            menuPriority: meta.menuPriority,
            icon: fb?.icon ?? <IconSparkle size={20} />,
            render: () => <SectionPlaceholder id={meta.id} />,
          };
        });
        if (mapped.length > 0) setMetaSections(mapped);
      })
      .catch(() => {
        /* RPC unavailable — keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [sectionsApi]);

  // Set initial active section once metadata is available.
  useEffect(() => {
    if (activeId === "" && metaSections.length > 0) {
      setActiveId(metaSections[0]!.id);
    }
  }, [activeId, metaSections]);

  const beginClose = useCallback(() => {
    setClosing((already) => {
      if (already) return already;
      if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        onClose();
        return already;
      }
      return true;
    });
  }, [onClose]);

  const handleAnimationEnd = useCallback(
    (event: React.AnimationEvent<HTMLDivElement>): void => {
      if (
        closing &&
        event.target === event.currentTarget &&
        event.animationName === "dsh-launcher-canvas-out"
      ) {
        onClose();
      }
    },
    [closing, onClose],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      const target = event.target;
      const dialog =
        target instanceof Element
          ? target.closest('[role="dialog"]')
          : null;
      if (dialog !== null && dialog !== canvasRef.current) return;
      beginClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [beginClose, document]);

  const slotEntries = useSyncExternalStore(
    (callback) => slotsView.subscribe(WORKSPACE_SECTION_SLOT, callback),
    () => slotsView.entries(WORKSPACE_SECTION_SLOT),
    () => slotsView.entries(WORKSPACE_SECTION_SLOT),
  );

  // Lock page scroll while the canvas is up.
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [document]);

  // Merge metadata sections with slot contributions.
  const sections = useMemo<readonly WorkspaceSection[]>(() => {
    const overrides = new Map<string, SlotEntryView>();
    for (const entry of slotEntries) {
      if (entry.options.id !== undefined)
        overrides.set(entry.options.id, entry);
    }
    return metaSections.map((section) => {
      const override = overrides.get(section.id);
      if (override === undefined) return section;
      const Component = override.component as
        | React.ComponentType<Record<string, unknown>>
        | undefined;
      if (Component === undefined) return section;
      return {
        ...section,
        render: () => <Component />,
      };
    });
  }, [metaSections, slotEntries]);

  const active =
    sections.find((section) => section.id === activeId) ?? sections[0];

  const groups = useMemo(() => {
    const out: {
      key: LauncherLocaleKey;
      sections: readonly WorkspaceSection[];
    }[] = [];
    for (const section of sections) {
      const last = out[out.length - 1];
      if (last !== undefined && last.key === section.groupKey) {
        last.sections = [...last.sections, section];
      } else {
        out.push({ key: section.groupKey, sections: [section] });
      }
    }
    return out;
  }, [sections]);

  const renderSectionBody = useCallback((): ReactNode => {
    if (active === undefined) {
      return (
        <div className="dsh-launcher-canvas-content-empty">
          <div className="dsh-launcher-canvas-content-empty-title">
            {t("workspace")}
          </div>
          <div>{t("workspaceHint")}</div>
        </div>
      );
    }
    if (renderSlot !== undefined) {
      return renderSlot(
        WORKSPACE_SECTION_SLOT,
        {},
        {
          only: active.id,
          fallback: active.render(),
        },
      );
    }
    return active.render();
  }, [active, renderSlot, t]);

  return (
    <div
      ref={canvasRef}
      className={`dsh-launcher-canvas${closing ? " is-closing" : ""}`}
      role="dialog"
      aria-label={t("workspace")}
      onAnimationEnd={handleAnimationEnd}
    >
      <button
        type="button"
        className="dsh-launcher-canvas-x"
        onClick={beginClose}
        aria-label={t("workspaceClose")}
        title={t("workspaceClose")}
      >
        <IconClose size={14} />
      </button>
      <nav className="dsh-launcher-canvas-menu" aria-label={t("menuSection")}>
        <div className="dsh-launcher-menu-scroll" data-open={menuOpen ? "true" : "false"}>
          <div className="dsh-launcher-menu-identity">
            <span className="dsh-launcher-menu-identity-icon">
              <IconGrid size={16} />
            </span>
            <span className="dsh-launcher-menu-identity-body">
              <span className="dsh-launcher-menu-identity-name">
                {t("workspace")}
              </span>
              <span className="dsh-launcher-menu-identity-hint">
                {t("workspaceIdentityHint")}
              </span>
            </span>
          </div>
          {groups.map((group) => (
            <div key={group.key} className="dsh-launcher-menu-group">
              <div className="dsh-launcher-canvas-menu-label">
                {t(group.key)}
              </div>
              {group.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`dsh-launcher-canvas-menu-item${section.id === active?.id ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveId(section.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className="dsh-launcher-canvas-menu-item-icon">
                    {section.icon}
                  </span>
                  <span className="dsh-launcher-canvas-menu-item-label">
                    {section.label}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>
      <main className="dsh-launcher-canvas-content" aria-busy={false}>
        {/* H5: the menu toggle rides IN the section-title line instead of
            claiming its own bar — one line of chrome, then content. */}
        <div className="dsh-launcher-canvas-topbar">
          <button
            type="button"
            className="dsh-launcher-menu-toggle"
            aria-expanded={menuOpen}
            aria-label={t("menuSection")}
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
          >
            {active !== undefined ? (
              <span className="dsh-launcher-menu-toggle-inner">
                <span className="dsh-launcher-menu-toggle-icon">
                  {active.icon}
                </span>
                <span className="dsh-launcher-menu-toggle-label">
                  {active.label}
                </span>
              </span>
            ) : (
              <span className="dsh-launcher-menu-toggle-label">
                {t("menuSection")}
              </span>
            )}
            <IconChevronDown
              size={14}
              {...(menuOpen ? { className: "is-open" } : {})}
            />
          </button>
          <SectionContent section={active} />
        </div>
        {renderSectionBody()}
      </main>
    </div>
  );
}

function SectionContent({
  section,
}: {
  readonly section: WorkspaceSection | undefined;
}): JSX.Element {
  if (section === undefined) return <></>;
  return (
    <header className="dsh-launcher-section-header">
      <div className="dsh-launcher-section-header-body">
        <h1 className="dsh-launcher-section-header-title">{section.label}</h1>
        {section.subtitle !== undefined ? (
          <p className="dsh-launcher-section-header-subtitle">
            {section.subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function SectionPlaceholder({ id }: { id: string }): JSX.Element {
  return (
    <div className="dsh-launcher-canvas-content-empty">
      <IconSparkle size={28} />
      <div className="dsh-launcher-canvas-content-empty-title">{id}</div>
      <div>等待 dsh-launcher.workspace.section / {id} 注册</div>
    </div>
  );
}
