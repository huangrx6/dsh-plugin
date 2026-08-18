/**
 * Launcher surfaces: the little rail button (LauncherTrigger) and the
 * floating launcher panel (LauncherPanel). Both live as React roots
 * mounted into DOM anchors — the rail button is anchored next to the
 * native settings trigger, the panel is portaled into <body> on demand.
 *
 * The panel hosts exactly two entries: "Personal workspace" opens the
 * full-screen overlay, "System settings" delegates to the native settings
 * trigger by clicking it (the platform's button keeps owning the modal,
 * the launcher just becomes a launcher).
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconChevronRight,
  IconClose,
  IconLauncher,
  IconSparkle,
} from "./icons.tsx";
import { on, emit, LauncherEvents } from "./events.ts";
import { findNativeSettingsTrigger } from "./dom-watcher.ts";
import { useLauncherLocale } from "./use-locale.ts";
import type { LauncherLocaleKey } from "./locales.ts";

interface LauncherTriggerProps {
  readonly wide: boolean;
  readonly onClick: () => void;
}

export function LauncherTrigger({
  wide,
  onClick,
}: LauncherTriggerProps): JSX.Element {
  const t = useLauncherLocale();
  return (
    <button
      id={TRIGGER_BTN_ID}
      type="button"
      className={`dsh-launcher-trigger${wide ? "" : " collapsed"}`}
      onClick={onClick}
      aria-label={t("launcher")}
      title={t("launcherHint")}
    >
      <span className="dsh-launcher-trigger-icon">
        <IconLauncher size={16} />
      </span>
      {wide ? (
        <span className="dsh-launcher-trigger-label">{t("launcher")}</span>
      ) : null}
    </button>
  );
}

export function LauncherPanel({
  document,
}: {
  document: Document;
}): JSX.Element | null {
  const t = useLauncherLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return on(document, LauncherEvents.PanelOpen, () => {
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

  if (!open) return null;

  const handlePersonal = (): void => {
    setOpen(false);
    emit(document, LauncherEvents.WorkspaceOpen);
  };
  const handleSystem = (): void => {
    setOpen(false);
    const native = findNativeSettingsTrigger(document);
    if (native !== undefined) {
      native.click();
      return;
    }
    emit(document, LauncherEvents.SystemSettingsOpen);
  };

  return createPortal(
    <div
      className="dsh-launcher-panel-mask"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        className="dsh-launcher-panel"
        role="dialog"
        aria-label={t("launcher")}
      >
        <header className="dsh-launcher-panel-head">
          <h2 className="dsh-launcher-panel-title">{t("launcher")}</h2>
          <span className="dsh-launcher-panel-hint">{t("launcherHint")}</span>
        </header>
        <div className="dsh-launcher-panel-body">
          <PanelItem
            icon={<IconSparkle size={18} />}
            title={t("personalEntry")}
            hint={t("personalEntryHint")}
            onClick={handlePersonal}
          />
          <PanelItem
            icon={<IconLauncher size={18} />}
            title={t("systemEntry")}
            hint={t("systemEntryHint")}
            onClick={handleSystem}
          />
        </div>
        <footer className="dsh-launcher-panel-foot">
          <button
            type="button"
            className="dsh-launcher-panel-close"
            onClick={() => setOpen(false)}
          >
            <span style={{ display: "inline-flex", marginRight: 4 }}>
              <IconClose size={12} />
            </span>
            {t("close")}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

interface PanelItemProps {
  readonly icon: JSX.Element;
  readonly title: string;
  readonly hint: string;
  readonly onClick: () => void;
}

function PanelItem({
  icon,
  title,
  hint,
  onClick,
}: PanelItemProps): JSX.Element {
  return (
    <button type="button" className="dsh-launcher-panel-item" onClick={onClick}>
      <span className="dsh-launcher-panel-item-icon">{icon}</span>
      <span className="dsh-launcher-panel-item-body">
        <span className="dsh-launcher-panel-item-title">{title}</span>
        <span className="dsh-launcher-panel-item-hint">{hint}</span>
      </span>
      <span className="dsh-launcher-panel-item-chev">
        <IconChevronRight size={14} />
      </span>
    </button>
  );
}

const TRIGGER_BTN_ID = "dsh-launcher-sidebar-trigger";
