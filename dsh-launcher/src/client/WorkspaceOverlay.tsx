/**
 * Workspace overlay. The full-screen canvas the launcher panel's "Personal
 * workspace" entry opens. Layout: a top bar with the title and the close
 * button, a left menu (or horizontal tab bar on H5) listing the launcher-
 * owned sections, and a right content area where each section renders its
 * own component.
 *
 * Section content is filled by slots contributed by other plugins (e.g.
 * dsh-skill-manager adds a Skills slot, dsh-mcp-manager adds an MCPs slot).
 * The launcher owns the chrome; the sections own their data and UI. The
 * slot key is `dsh-launcher.workspace.section`; the workspace merges
 * contributions by id with the default sections (slot entries override
 * the placeholder render for matching ids).
 *
 * The slot registry is handed in as a prop because the overlay is mounted
 * as a detached React root — the cordis context lives behind the apply()
 * entry, not the React subtree. The prop surface is the same narrow shape
 * as the SlotRegistry methods the overlay actually calls.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  IconArchive,
  IconClose,
  IconLayout,
  IconMcp,
  IconRemote,
  IconSkills,
  IconSparkle,
} from "./icons.tsx";
import { on, emit, LauncherEvents } from "./events.ts";
import { useLauncherLocale } from "./use-locale.ts";
import type { LauncherLocaleKey } from "./locales.ts";

export interface WorkspaceSection {
  /** Stable id — the workspace persists this across renders. */
  readonly id: string;
  /** Localized label key. */
  readonly labelKey: LauncherLocaleKey;
  /** Short subtitle shown under the title in the section header. */
  readonly subtitleKey?: LauncherLocaleKey;
  /** Inline icon (a ReactElement). */
  readonly icon: JSX.Element;
  /** Section renderer. Defaults to the placeholder; replaced by slot
      contributions matching the id. */
  readonly render: () => JSX.Element;
}

/**
 * Minimal slot view the workspace needs. We deliberately type-narrow to
 * the methods we use so the prop surface is obvious and the runtime
 * SlotRegistry can be passed without further casts.
 */
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

/**
 * The default set of sections. Slot contributions override these by id.
 * The icons and labels are launcher-owned; the renderer is replaced when
 * a plugin registers a marketplace for the matching id.
 */
export const DEFAULT_SECTIONS: readonly WorkspaceSection[] = [
  {
    id: "skills",
    labelKey: "menuSkills",
    subtitleKey: "menuSkillsSubtitle",
    icon: <IconSkills size={20} />,
    render: () => <SectionPlaceholder id="skills" />,
  },
  {
    id: "mcp",
    labelKey: "menuMcp",
    subtitleKey: "menuMcpSubtitle",
    icon: <IconMcp size={20} />,
    render: () => <SectionPlaceholder id="mcp" />,
  },
  {
    id: "remote",
    labelKey: "menuRemote",
    subtitleKey: "menuRemoteSubtitle",
    icon: <IconRemote size={20} />,
    render: () => <SectionPlaceholder id="remote" />,
  },
  {
    id: "archive",
    labelKey: "menuArchive",
    subtitleKey: "menuArchiveSubtitle",
    icon: <IconArchive size={20} />,
    render: () => <SectionPlaceholder id="archive" />,
  },
  {
    id: "layout",
    labelKey: "menuLayout",
    subtitleKey: "menuLayoutSubtitle",
    icon: <IconLayout size={20} />,
    render: () => <SectionPlaceholder id="layout" />,
  },
];

export interface WorkspaceOverlayProps {
  readonly document: Document;
  /** Slot registry handle. The overlay consumes its `entries` for the
      workspace section slot and subscribes for live updates. */
  readonly slots: SlotRegistryLike;
}

export function WorkspaceOverlay({
  document,
  slots,
}: WorkspaceOverlayProps): JSX.Element | null {
  const t = useLauncherLocale();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(
    DEFAULT_SECTIONS[0]?.id ?? "",
  );

  const slotEntries = useSyncExternalStore(
    (callback) => slots.subscribe(WORKSPACE_SECTION_SLOT, callback),
    () => slots.entries(WORKSPACE_SECTION_SLOT),
    () => slots.entries(WORKSPACE_SECTION_SLOT),
  );

  useEffect(() => {
    return on(document, LauncherEvents.WorkspaceOpen, () => {
      setOpen(true);
    });
  }, [document]);

  useEffect(() => {
    return on(document, LauncherEvents.WorkspaceClose, () => {
      setOpen(false);
    });
  }, [document]);

  useEffect(() => {
    return on(document, LauncherEvents.WorkspaceNavigate, (event) => {
      const detail = event.detail;
      if (detail !== null && typeof detail === "object" && "id" in detail) {
        const id = (detail as { id: unknown }).id;
        if (typeof id === "string") setActiveId(id);
      }
      setOpen(true);
    });
  }, [document]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [document, open]);

  const close = useCallback(() => {
    setOpen(false);
    emit(document, LauncherEvents.WorkspaceClose);
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
      const Component = override.component as React.ComponentType<unknown>;
      return {
        ...section,
        render: () => <Component />,
      };
    });
  }, [slotEntries]);

  const active =
    sections.find((section) => section.id === activeId) ?? sections[0];

  if (!open) return null;

  return createPortal(
    <div
      className="dsh-launcher-canvas"
      role="dialog"
      aria-label={t("workspace")}
    >
      <header className="dsh-launcher-canvas-topbar">
        <span className="dsh-launcher-canvas-title">{t("workspace")}</span>
        <span className="dsh-launcher-canvas-hint">{t("workspaceHint")}</span>
        <span className="dsh-launcher-canvas-spacer" />
        <button
          type="button"
          className="dsh-launcher-canvas-close"
          onClick={close}
          aria-label={t("workspaceClose")}
        >
          <IconClose size={12} />
          <span>{t("workspaceClose")}</span>
        </button>
      </header>
      <nav className="dsh-launcher-canvas-menu" aria-label={t("menuSection")}>
        <div className="dsh-launcher-canvas-menu-label">{t("menuSection")}</div>
        {sections.map((section) => (
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
      </nav>
      <main className="dsh-launcher-canvas-content" aria-busy={false}>
        {active === undefined ? (
          <div className="dsh-launcher-canvas-content-empty">
            <div className="dsh-launcher-canvas-content-empty-title">
              {t("workspace")}
            </div>
            <div>{t("workspaceHint")}</div>
          </div>
        ) : (
          <SectionContent section={active} translate={t} />
        )}
      </main>
    </div>,
    document.body,
  );
}

/**
 * Section header + body. The header is the launcher's content-area polish
 * (icon + title + subtitle on a row, separated from the body by a thin
 * divider). The body is the section's actual render — a slot-registered
 * component or a placeholder.
 */
function SectionContent({
  section,
  translate,
}: {
  readonly section: WorkspaceSection;
  readonly translate: (key: LauncherLocaleKey) => string;
}): JSX.Element {
  return (
    <div>
      <header className="dsh-launcher-section-header">
        <span className="dsh-launcher-section-header-tile">{section.icon}</span>
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
      {section.render()}
    </div>
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
