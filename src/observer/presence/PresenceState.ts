import { Observer } from "../core/Observer";
import type { ObserverMode } from "../types";

/**
 * Presence — high-level awareness controller. Other systems (Journeys,
 * Contemplation, Comparison) call into PresenceState to declare what the
 * Observer is currently doing; the Observer mode is the single source of
 * truth consumed by the HUD.
 */

let modeStack: ObserverMode[] = ["idle"];

export const Presence = {
  enter(mode: ObserverMode) {
    modeStack.push(mode);
    Observer.setMode(mode);
  },
  leave(mode: ObserverMode) {
    modeStack = modeStack.filter((m) => m !== mode);
    Observer.setMode(modeStack[modeStack.length - 1] ?? "idle");
  },
  set(mode: ObserverMode) {
    modeStack = [mode];
    Observer.setMode(mode);
  },
  current(): ObserverMode {
    return modeStack[modeStack.length - 1] ?? "idle";
  },
};
