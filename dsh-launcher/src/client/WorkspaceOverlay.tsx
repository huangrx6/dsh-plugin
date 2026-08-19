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
import {
  IconArchive,
  IconClose,
  IconGrid,
  IconLayout,
  IconMcp,
  IconRemote,
  IconSkills,
  IconSparkle,
} from "./icons.tsx";
import type { LauncherLocaleKey } from "./locales.ts";

export interface WorkspaceSection {
  /** Stable id — the workspace persists this across renders. */
  readonly id: string;
  /** Localized label key. */
  readonly labelKey: LauncherLocaleKey;
  /** Short subtitle shown under the title in the section header. */
  readonly subtitleKey?: LauncherLocaleKey;
  /** Localized key of the nav group this section lives under. */
  readonly groupKey: LauncherLocaleKey;
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

export const WORKSPACE_SECTION_SLOT = "dsh-launcher.workspace.section";

/** Sections the launcher itself ships. Slot contributions override these
    by id (a plugin registering id 'skills' replaces the placeholder). */
export const DEFAULT_SECTIONS: readonly WorkspaceSection[] = [
  {
    id: "skills",
    labelKey: "menuSkills",
    subtitleKey: "menuSkillsSubtitle",
    groupKey: "menuGroupManage",
    icon: <IconSkills size={20} />,
    render: () => <SectionPlaceholder id="skills" />,
  },
  {
    id: "mcp",
    labelKey: "menuMcp",
    subtitleKey: "menuMcpSubtitle",
    groupKey: "menuGroupManage",
    icon: <IconMcp size={20} />,
    render: () => <SectionPlaceholder id="mcp" />,
  },
  {
    id: "remote",
    labelKey: "menuRemote",
    subtitleKey: "menuRemoteSubtitle",
    groupKey: "menuGroupTools",
    icon: <IconRemote size={20} />,
    render: () => <SectionPlaceholder id="remote" />,
  },
  {
    id: "archive",
    labelKey: "menuArchive",
    subtitleKey: "menuArchiveSubtitle",
    groupKey: "menuGroupTools",
    icon: <IconArchive size={20} />,
    render: () => <SectionPlaceholder id="archive" />,
  },
  {
    id: "layout",
    labelKey: "menuLayout",
    subtitleKey: "menuLayoutSubtitle",
    groupKey: "menuGroupAppearance",
    icon: <IconLayout size={20} />,
    render: () => <SectionPlaceholder id="layout" />,
  },
];

export interface WorkspaceViewProps {
  readonly t: (key: LauncherLocaleKey) => string;
  readonly document: Document;
  readonly slotsView: SlotRegistryLike;
  /** Framework renderSlot narrowed to our declared children; when present,
      plugin sections render through the platform's own machinery (props,
      error boundaries, locale seats all included). Typed with the
      framework's own PropsRenderSlots so the composed-props contract
      checks structurally at the register site. `| undefined` keeps the
      optional prop assignable under exactOptionalPropertyTypes. */
  readonly renderSlot?:
    | PropsRenderSlots<"dsh-launcher.workspace.section">["renderSlot"]
    | undefined;
  readonly onClose: () => void;
}

export function WorkspaceView({
  t,
  document,
  slotsView,
  renderSlot,
  onClose,
}: WorkspaceViewProps): JSX.Element {
  const [activeId, setActiveId] = useState<string>(
    DEFAULT_SECTIONS[0]?.id ?? "",
  );
  // Exit choreography: closing first plays the canvas-out animation and
  // only then unmounts (animationend on the root's own animation).
  // prefers-reduced-motion skips the wait — the stylesheet drops the
  // animation entirely there, so waiting would hang the surface open.
  const [closing, setClosing] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

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
      // Modals render through portals at body level and trap focus, so
      // an Escape typed with a modal open originates INSIDE that modal,
      // not inside the canvas. Let the modal's own Escape handling win
      // — exiting the workspace here would skip a layer (one press must
      // close the modal, the next the canvas).
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

  // Lock page scroll while the canvas is up (the overlay is fixed, so the
  // page behind it shouldn't scroll on wheel/touch).
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [document]);

  const sections = useMemo<readonly WorkspaceSection[]>(() => {
    const overrides = new Map<string, SlotEntryView>();
    for (const entry of slotEntries) {
      if (entry.options.id !== undefined)
        overrides.set(entry.options.id, entry);
    }
    return DEFAULT_SECTIONS.map((section) => {
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
  }, [slotEntries]);

  const active =
    sections.find((section) => section.id === activeId) ?? sections[0];

  // Nav groups preserve DEFAULT_SECTIONS order: 管理 (skills/mcp),
  // 工具 (remote/archive), 外观 (layout) — like the reference layout,
  // grouped with small caps headers instead of one flat list.
  const groups = useMemo(() => {
    const out: { key: LauncherLocaleKey; sections: readonly WorkspaceSection[] }[] = [];
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
    // Preferred path: the framework's renderSlot (only this entry is
    // authorized to render the slot, and plugin entries get their full
    // composed props — injected api, locale seat, error boundary). The
    // `only` opt narrows the list to the active section's id.
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
      {/* Always-visible corner X: the rail-bottom exit alone proved too
          hard to find; a top-right close is where every desktop app
          puts it. Absolute over the grid, above both panes. */}
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
        {/* Groups scroll; the exit stays pinned to the rail's bottom like
            every modern sidebar's secondary action. */}
        <div className="dsh-launcher-menu-scroll">
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
              <div className="dsh-launcher-canvas-menu-label">{t(group.key)}</div>
              {group.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`dsh-launcher-canvas-menu-item${section.id === active?.id ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveId(section.id);
                  }}
                >
                  <span className="dsh-launcher-canvas-menu-item-icon">
                    {section.icon}
                  </span>
                  <span className="dsh-launcher-canvas-menu-item-label">
                    {t(section.labelKey)}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>
      <main className="dsh-launcher-canvas-content" aria-busy={false}>
        <SectionContent section={active} translate={t} />
        {renderSectionBody()}
      </main>
    </div>
  );
}

/** Section header: slim title row (title + subtitle, hairline below) —
    the content speaks, not a hero tile. */
function SectionContent({
  section,
  translate,
}: {
  readonly section: WorkspaceSection | undefined;
  readonly translate: (key: LauncherLocaleKey) => string;
}): JSX.Element {
  if (section === undefined) return <></>;
  return (
    <header className="dsh-launcher-section-header">
      <div className="dsh-launcher-section-header-body">
        <h1 className="dsh-launcher-section-header-title">
          {translate(section.labelKey)}
        </h1>
        {section.subtitleKey === undefined ? null : (
          <p className="dsh-launcher-section-header-subtitle">
            {translate(section.subtitleKey)}
          </p>
        )}
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
