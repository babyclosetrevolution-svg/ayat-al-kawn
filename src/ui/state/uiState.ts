/**
 * UIState — single source of truth for interface presence.
 *
 * The Universe is the main character; panels are guests. Every UI surface
 * subscribes here and reacts uniformly to user activity, selections and
 * cinematic travel. This avoids each panel inventing its own visibility
 * rules and keeps the motion language consistent.
 */

export type PanelId = "explorer" | "knowledge";
export type PanelState = "closed" | "open";

/**
 * Activity is a coarse classification of what the user is currently doing.
 *  - idle:        no input for a while — show minimal controls.
 *  - inspecting:  a body was just selected — surface knowledge.
 *  - navigating:  the user is dragging / zooming — reduce UI opacity.
 *  - cinematic:   the camera is travelling on its own — hide everything.
 */
export type Activity = "idle" | "inspecting" | "navigating" | "cinematic";

export interface UISnapshot {
  panels: Record<PanelId, PanelState>;
  pinned: Record<PanelId, boolean>;
  activity: Activity;
}

const STORAGE_KEY = "ayat:ui:pinned";

function loadPinned(): Record<PanelId, boolean> {
  if (typeof window === "undefined") return { explorer: false, knowledge: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { explorer: false, knowledge: false };
    const parsed = JSON.parse(raw) as Partial<Record<PanelId, boolean>>;
    return {
      explorer: !!parsed.explorer,
      knowledge: !!parsed.knowledge,
    };
  } catch {
    return { explorer: false, knowledge: false };
  }
}

class UIStateImpl {
  private snap: UISnapshot = {
    panels: { explorer: "closed", knowledge: "closed" },
    pinned: loadPinned(),
    activity: "idle",
  };
  private listeners = new Set<(s: UISnapshot) => void>();
  private activityTimer: ReturnType<typeof setTimeout> | null = null;

  get(): UISnapshot {
    return this.snap;
  }

  subscribe(cb: (s: UISnapshot) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emit() {
    // Re-create the snapshot object so React `useSyncExternalStore`-ish
    // consumers re-render on identity change.
    this.snap = { ...this.snap };
    for (const l of this.listeners) l(this.snap);
  }

  // --- panel control --------------------------------------------------

  open(id: PanelId) {
    if (this.snap.panels[id] === "open") return;
    this.snap.panels = { ...this.snap.panels, [id]: "open" };
    this.emit();
  }

  close(id: PanelId, opts: { force?: boolean } = {}) {
    if (this.snap.pinned[id] && !opts.force) return;
    if (this.snap.panels[id] === "closed") return;
    this.snap.panels = { ...this.snap.panels, [id]: "closed" };
    this.emit();
  }

  toggle(id: PanelId) {
    if (this.snap.panels[id] === "open") this.close(id, { force: true });
    else this.open(id);
  }

  setPinned(id: PanelId, value: boolean) {
    if (this.snap.pinned[id] === value) return;
    this.snap.pinned = { ...this.snap.pinned, [id]: value };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snap.pinned));
    } catch {
      /* storage may be disabled — ignore */
    }
    this.emit();
  }

  closeAllUnpinned() {
    const next = { ...this.snap.panels };
    let changed = false;
    for (const id of Object.keys(next) as PanelId[]) {
      if (!this.snap.pinned[id] && next[id] === "open") {
        next[id] = "closed";
        changed = true;
      }
    }
    if (changed) {
      this.snap.panels = next;
      this.emit();
    }
  }

  // --- activity -------------------------------------------------------

  setActivity(a: Activity, holdMs = a === "cinematic" ? 1200 : 600) {
    this.snap.activity = a;
    this.emit();
    if (this.activityTimer) clearTimeout(this.activityTimer);
    if (a !== "idle" && a !== "inspecting") {
      this.activityTimer = setTimeout(() => {
        this.snap.activity = "idle";
        this.emit();
      }, holdMs);
    }
  }
}

export const UIState = new UIStateImpl();
