import type { FlightTier } from "./types";

/**
 * FlightState — tiny pub/sub store the CameraSystem writes into each frame,
 * so DOM overlays (HUD, onboarding hint) can react without touching R3F.
 *
 * Kept intentionally minimal; no camera ownership, no interaction with
 * FlightController — just a mirror of what the flight layer is doing.
 */

export interface FlightSnapshot {
  /** Adaptive speed tier currently in effect. */
  tier: FlightTier;
  /** Current linear speed in world units / second. */
  speed: number;
  /** Whether an object is currently focused (journey or observation). */
  focused: boolean;
  /** True while the user is actively translating via WASD / joystick. */
  translating: boolean;
}

const state: FlightSnapshot = {
  tier: "medium",
  speed: 0,
  focused: false,
  translating: false,
};

const listeners = new Set<(s: FlightSnapshot) => void>();
let scheduled = false;

function flush() {
  scheduled = false;
  for (const l of listeners) l(state);
}

export const FlightState = {
  get(): FlightSnapshot {
    return state;
  },
  set(patch: Partial<FlightSnapshot>) {
    let changed = false;
    for (const k of Object.keys(patch) as (keyof FlightSnapshot)[]) {
      const v = patch[k];
      if (v !== undefined && state[k] !== v) {
        // Number coercion keeps TS happy across the union type.
        (state as Record<string, unknown>)[k] = v;
        changed = true;
      }
    }
    if (!changed || scheduled) return;
    scheduled = true;
    queueMicrotask(flush);
  },
  subscribe(cb: (s: FlightSnapshot) => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
