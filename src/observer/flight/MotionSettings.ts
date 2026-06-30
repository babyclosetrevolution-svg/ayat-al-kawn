import type { MotionSettings } from "./types";

/**
 * MotionSettings — persisted flight preferences (sensitivity, invert axes,
 * reduced motion). Stored under a single localStorage key; no UI is
 * coupled here so any settings surface can read/write through the same
 * tiny API.
 */

const STORAGE_KEY = "ayat:flight:motion";

const DEFAULTS: MotionSettings = {
  sensitivity: 1,
  lookSensitivity: 1,
  invertX: false,
  invertY: false,
  reduceMotion: false,
};

function load(): MotionSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<MotionSettings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: MotionSettings = load();
const listeners = new Set<(s: MotionSettings) => void>();

export const MotionSettingsStore = {
  get(): MotionSettings {
    return current;
  },
  set(patch: Partial<MotionSettings>) {
    current = { ...current, ...patch };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      /* storage may be disabled */
    }
    for (const l of listeners) l(current);
  },
  subscribe(cb: (s: MotionSettings) => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  reset() {
    this.set({ ...DEFAULTS });
  },
};

export { DEFAULTS as DEFAULT_MOTION_SETTINGS };
