import type { AppMode, GeoLocation } from "./types";

interface ObservatoryStateSnapshot {
  mode: AppMode;
  date: Date;
  /** Frozen time, else `date` follows the wall clock. */
  paused: boolean;
  location: GeoLocation;
  showEquatorialGrid: boolean;
  showAzimuthalGrid: boolean;
  showConstellationLines: boolean;
  showConstellationLabels: boolean;
}

type Listener = (s: ObservatoryStateSnapshot) => void;

class ObservatoryStateImpl {
  private state: ObservatoryStateSnapshot = {
    mode: "universe",
    date: new Date(),
    paused: false,
    location: { latitude: 31.7917, longitude: -7.0926, label: "Marrakesh, Morocco" },
    showEquatorialGrid: false,
    showAzimuthalGrid: true,
    showConstellationLines: true,
    showConstellationLabels: true,
  };
  private listeners = new Set<Listener>();
  private tickHandle: number | null = null;

  get(): ObservatoryStateSnapshot { return this.state; }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    for (const l of this.listeners) l(this.state);
  }

  patch(p: Partial<ObservatoryStateSnapshot>) {
    this.state = { ...this.state, ...p };
    this.emit();
  }

  setMode(mode: AppMode) {
    this.patch({ mode });
    if (mode === "observatory") this.startClock();
    else this.stopClock();
  }

  setLocation(location: GeoLocation) { this.patch({ location }); }
  setDate(date: Date) { this.patch({ date }); }
  setPaused(paused: boolean) {
    this.patch({ paused });
    if (!paused) this.startClock();
    else this.stopClock();
  }

  private startClock() {
    if (this.tickHandle != null) return;
    this.tickHandle = window.setInterval(() => {
      if (this.state.paused || this.state.mode !== "observatory") return;
      this.patch({ date: new Date() });
    }, 1000);
  }
  private stopClock() {
    if (this.tickHandle != null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }
}

export const ObservatoryState = new ObservatoryStateImpl();
export type { ObservatoryStateSnapshot };
