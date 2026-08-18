/**
 * Launcher panel view — the floating two-entry panel the FAB (or the
 * side-rail button) opens. Rendered inline by LauncherHost; no portals,
 * no own React root (the platform renders the whole overlay entry).
 *
 * Two entries exactly: "Personal workspace" opens the full-screen canvas,
 * "System settings" delegates to the native settings trigger by clicking
 * it — the platform's button keeps owning the modal.
 */
import { IconChevronRight, IconClose, IconLauncher, IconSparkle } from "./icons.tsx";
import type { LauncherLocaleKey } from "./locales.ts";

export interface LauncherPanelViewProps {
  readonly t: (key: LauncherLocaleKey) => string;
  readonly onPersonal: () => void;
  readonly onSystem: () => void;
  readonly onClose: () => void;
}

export function LauncherPanelView({
  t,
  onPersonal,
  onSystem,
  onClose,
}: LauncherPanelViewProps): JSX.Element {
  return (
    <div
      className="dsh-launcher-panel-mask"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dsh-launcher-panel" role="dialog" aria-label={t("launcher")}>
        <header className="dsh-launcher-panel-head">
          <h2 className="dsh-launcher-panel-title">{t("launcher")}</h2>
          <span className="dsh-launcher-panel-hint">{t("launcherHint")}</span>
        </header>
        <div className="dsh-launcher-panel-body">
          <PanelItem
            icon={<IconSparkle size={18} />}
            title={t("personalEntry")}
            hint={t("personalEntryHint")}
            onClick={onPersonal}
          />
          <PanelItem
            icon={<IconLauncher size={18} />}
            title={t("systemEntry")}
            hint={t("systemEntryHint")}
            onClick={onSystem}
          />
        </div>
        <footer className="dsh-launcher-panel-foot">
          <button
            type="button"
            className="dsh-launcher-panel-close"
            onClick={onClose}
          >
            <span style={{ display: "inline-flex", marginRight: 4 }}>
              <IconClose size={12} />
            </span>
            {t("close")}
          </button>
        </footer>
      </div>
    </div>
  );
}

interface PanelItemProps {
  readonly icon: JSX.Element;
  readonly title: string;
  readonly hint: string;
  readonly onClick: () => void;
}

function PanelItem({ icon, title, hint, onClick }: PanelItemProps): JSX.Element {
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
