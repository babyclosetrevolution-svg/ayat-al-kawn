import type { FocusKey } from "../../world/state/focus";

/**
 * Observer Engine — shared types.
 *
 * The Observer is the living entity that explores the Universe. It is not
 * an avatar and not the camera. The camera becomes a component attached to
 * the Observer; navigation, awareness and state ownership move here.
 *
 * Existing scientific, rendering, knowledge, discovery, encyclopedia and
 * science modules remain untouched. The Observer composes their outputs.
 */

export type ObserverMode =
  | "idle"
  | "learning"
  | "cruise"
  | "precision"
  | "observe"
  | "travel"
  | "inspect"
  | "boost"
  | "journey"
  | "contemplation";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface ObserverKinematics {
  position: Vec3;
  orientation: Quat;
  velocity: Vec3;
  acceleration: Vec3;
}

export interface ObserverAwareness {
  /** Currently focused celestial body id (mirrors FocusRegistry). */
  focus: FocusKey;
  /** Tracked secondary targets (comparison, journey waypoints). */
  watching: string[];
  /** Last meaningful user interaction timestamp (ms). */
  lastInteractionAt: number;
}

export interface ObserverState extends ObserverKinematics {
  mode: ObserverMode;
  awareness: ObserverAwareness;
  /** Scalar travel speed in world units / second (smoothed). */
  speed: number;
}

export type ObserverListener = (s: ObserverState) => void;
