/**
 * Phone-only header overflow menu.
 *
 * Reference design: `[☰] 标题 · 预设徽标 ···` — on phones the session
 * title needs the whole line, so EVERY interactive header action
 * (subagents, background tasks, Session log, share…) folds into a
 * trailing "···" button pinned top-right, mirroring the hamburger
 * top-left. Non-interactive badges (the preset mode chip) stay.
 *
 * Stock header anatomy (measured): titleRow > titleCluster > headerActions
 * > an anonymous slot wrapper whose children are the plugin units
 * (span.SVAs4q_label preset badge, div.h8S2Va_root subagents,
 * div.QsffPG_root background tasks), plus headerUtilities > wrapper >
 * button (Session log). Popover panels mount INSIDE their unit root
 * (e.g. .QsffPG_menu is a child of QsffPG_root), so folding hides the
 * TRIGGER BUTTON only — the root stays in flow (collapses to zero
 * width) and keeps the panel's anchor alive.
 *
 * Tapping ··· lists the folded actions; tapping an entry clicks the
 * ORIGINAL stock trigger so its own popover opens (menu-clamp keeps
 * that panel inside the viewport). Desktop is untouched.
 */

const MORE_CLASS = "dsh-layout-header-more";
const SHEET_CLASS = "dsh-layout-header-overflow";

interface ActionUnit {
  readonly root: HTMLElement;
  readonly trigger: HTMLButtonElement;
}

function isPhone(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

function labelOf(el: HTMLElement): string {
  return (el.getAttribute("aria-label") || el.textContent || "").trim();
}

/** Header action units: interactive slot children of the action clusters.
 *  As of recent DSH, the subagent (and now-collapsed task panel) trigger
 *  moved out of `headerActions` into the breadcrumb `titleCluster` as a
 *  standalone button — old selector `[class*='_headerActions']` misses it.
 *  Scan both action clusters AND the title-cluster trigger buttons, skipping
 *  breadcrumbs (crumb classes / current) and view tabs (`_tab`) which are
 *  route-switchers, not session actions. */
function collectUnits(row: HTMLElement): ActionUnit[] {
  const units: ActionUnit[] = [];
  const seen = new Set<Element>();
  for (const cluster of row.querySelectorAll<HTMLElement>(
    "[class*='_headerActions'], [class*='_headerUtilities']",
  )) {
    // Grandchildren catch the slot wrapper's units; ":scope > button"
    // catches stock buttons mounted directly in the cluster.
    for (const root of cluster.querySelectorAll<HTMLElement>(
      ":scope > * > *, :scope > button",
    )) {
      if (seen.has(root)) continue;
      seen.add(root);
      // The unit may BE the button (headerUtilities > wrapper > button) or
      // WRAP one (h8S2Va_root > button) — querySelector misses the former.
      const trigger =
        root.querySelector<HTMLButtonElement>("button") ??
        (root instanceof HTMLButtonElement ? root : null);
      // No button inside → informational badge (preset mode chip), stays.
      if (trigger === null) continue;
      units.push({ root, trigger });
    }
  }
  // New DSH: subagent + task-panel merged into a single trigger button
  // parked inside the title-cluster breadcrumb area (class `ZKlsPq_trigger`).
  // Pick it up explicitly so it still folds into the ··· sheet on phones.
  for (const trigger of row.querySelectorAll<HTMLElement>(
    ".wSkVaW_titleCluster button[class*='_trigger']",
  )) {
    if (seen.has(trigger)) continue;
    seen.add(trigger);
    // The trigger itself is the unit — root is the trigger for compatibility
    // with `hide()` which hides the root, and the trigger is what we click.
    units.push({ root: trigger, trigger: trigger as HTMLButtonElement });
  }
  return units;
}

/** Assign display:none on the trigger without churning mutation records. */
function hide(el: HTMLElement, hidden: boolean): void {
  const next = hidden ? "none" : "";
  if (el.style.display !== next) el.style.display = next;
}

export function installMenuOverflow(doc: Document): () => void {
  const media = window.matchMedia("(max-width: 767px)");
  let observer: MutationObserver | undefined;
  let raf = 0;
  let more: HTMLButtonElement | undefined;
  let sheet: HTMLDivElement | undefined;
  let sheetRow: HTMLElement | undefined;

  const closeSheet = (): void => {
    if (sheet === undefined || sheet.hidden) return;
    sheet.hidden = true;
    more?.setAttribute("aria-expanded", "false");
  };

  const openSheet = (): void => {
    if (more === undefined || sheet === undefined) return;
    // (Re)build entries from the currently folded triggers.
    sheet.textContent = "";
    const row = sheetRow;
    if (row !== undefined && row.isConnected) {
      for (const unit of collectUnits(row)) {
        if (unit.trigger.dataset.dshFolded !== "1") continue;
        const item = doc.createElement("button");
        item.type = "button";
        item.className = SHEET_CLASS + "__item";
        item.setAttribute("role", "menuitem");
        item.textContent = labelOf(unit.trigger) || "…";
        item.addEventListener("click", () => {
          closeSheet();
          unit.trigger.click();
        });
        sheet.append(item);
      }
    }
    sheet.hidden = false;
    more.setAttribute("aria-expanded", "true");
    // Anchor below the ··· button; flip up if it would spill the viewport.
    const rect = more.getBoundingClientRect();
    sheet.style.top = Math.round(rect.bottom + 6) + "px";
    const height = sheet.getBoundingClientRect().height;
    if (rect.bottom + 6 + height > window.innerHeight) {
      sheet.style.top = Math.max(8, Math.round(rect.top - height - 6)) + "px";
    }
  };

  const ensureWidgets = (row: HTMLElement): void => {
    // A remounted titleRow (page switch) orphans the old widgets.
    if (sheetRow !== undefined && sheetRow !== row) closeSheet();
    sheetRow = row;
    if (
      more !== undefined &&
      more.isConnected &&
      sheet !== undefined &&
      sheet.isConnected
    ) {
      return;
    }
    more?.remove();
    sheet?.remove();

    sheet = doc.createElement("div");
    sheet.className = SHEET_CLASS;
    sheet.setAttribute("role", "menu");
    sheet.setAttribute("aria-label", "更多操作");
    sheet.hidden = true;
    doc.body.append(sheet);

    more = doc.createElement("button");
    more.type = "button";
    more.className = MORE_CLASS;
    more.setAttribute("aria-label", "更多");
    more.setAttribute("aria-haspopup", "menu");
    more.setAttribute("aria-expanded", "false");
    more.innerHTML =
      '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">' +
      '<circle cx="3.5" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="12.5" cy="8" r="1.4"/>' +
      "</svg>";
    more.addEventListener("click", (event) => {
      event.stopPropagation();
      if (sheet?.hidden === false) closeSheet();
      else openSheet();
    });
    doc.body.append(more);
  };

  const sweep = (): void => {
    // Scope the title row to the chrome header (plugin mark written only on
    // chat / trace views). A stock page such as the personal space happens
    // to render its own `_titleRow` with `_headerActions` / `_headerUtilities`
    // clusters too — sweeping it there would hide the page's native
    // menu / toggle behind the ··· sheet, and the page never sees a
    // chat-flavoured folded row, so its own button never came back.
    const row = doc.querySelector<HTMLElement>(
      "[data-dsh-layout-chrome-header] [class*='_titleRow']",
    );
    if (row === null) {
      closeSheet();
      if (more !== undefined) hide(more, true);
      return;
    }
    ensureWidgets(row);
    if (more === undefined || sheet === undefined) return;
    if (!isPhone()) {
      closeSheet();
      for (const unit of collectUnits(row)) {
        hide(unit.trigger, false);
        delete unit.trigger.dataset.dshFolded;
      }
      hide(more, true);
      delete row.dataset.dshOverflow;
      return;
    }
    let folded = 0;
    for (const unit of collectUnits(row)) {
      hide(unit.trigger, true);
      unit.trigger.dataset.dshFolded = "1";
      folded += 1;
    }
    hide(more, folded === 0);
    if (folded === 0) {
      closeSheet();
      delete row.dataset.dshOverflow;
    } else {
      row.dataset.dshOverflow = "1";
    }
  };

  const wake = (): void => {
    if (raf !== 0) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      sweep();
    });
  };

  const start = (): void => {
    if (observer !== undefined) return;
    observer = new MutationObserver(wake);
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "aria-label"],
    });
    wake();
  };

  const stop = (): void => {
    observer?.disconnect();
    observer = undefined;
    if (raf !== 0) window.cancelAnimationFrame(raf);
    raf = 0;
    sweep(); // restores stock visibility
  };

  const onMedia = (): void => {
    if (media.matches) start();
    else stop();
  };
  onMedia();
  media.addEventListener("change", onMedia);

  // Dismiss on outside tap / Esc.
  const onDown = (event: Event): void => {
    if (sheet === undefined || sheet.hidden) return;
    const target = event.target;
    if (
      target instanceof Node &&
      !sheet.contains(target) &&
      !(more !== undefined && more.contains(target))
    ) {
      closeSheet();
    }
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") closeSheet();
  };
  doc.addEventListener("pointerdown", onDown, true);
  doc.addEventListener("keydown", onKey, true);

  return () => {
    media.removeEventListener("change", onMedia);
    doc.removeEventListener("pointerdown", onDown, true);
    doc.removeEventListener("keydown", onKey, true);
    stop();
    closeSheet();
    more?.remove();
    sheet?.remove();
    more = undefined;
    sheet = undefined;
    sheetRow = undefined;
  };
}
