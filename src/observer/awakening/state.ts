/**
 * Awakening — persisted introduction state.
 *
 * Tracks whether the user has already lived the Observer Awakening so it
 * never replays automatically. The settings surface (and any future
 * /settings page) can call `replay()` to re-arm the experience.
 */

const STORAGE_KEY = "ayat:awakening:seen";

const listeners = new Set<(seen: boolean) => void>();

function load(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let seen = load();

export const AwakeningState = {
  hasSeen(): boolean {
    return seen;
  },
  markSeen() {
    seen = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    for (const l of listeners) l(seen);
  },
  replay() {
    seen = false;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    for (const l of listeners) l(seen);
  },
  subscribe(cb: (seen: boolean) => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
