/**
 * Flight module — shared types.
 *
 * The Observer never walks or runs; it glides. These types describe the
 * input state, motion settings and velocity profiles consumed by the
 * FlightController. They are intentionally tiny and engine-agnostic so the
 * controller can later drive other camera attachments without changes.
 */

export interface InputState {
  /** Translation axes, each in [-1, 1]. */
  forward: number;
  strafe: number;
  vertical: number;
  /** Held boost (Shift). */
  boost: boolean;
  /** Held brake (Space). */
  brake: boolean;
  /** Pointer delta accumulated since the last frame, in radians. */
  yaw: number;
  pitch: number;
}

export type FlightTier = "very-slow" | "medium" | "fast" | "very-fast";

export interface MotionSettings {
  /** Master multiplier on translation speed. */
  sensitivity: number;
  /** Mouse-look gain. */
  lookSensitivity: number;
  invertX: boolean;
  invertY: boolean;
  reduceMotion: boolean;
}

export interface VelocityProfile {
  tier: FlightTier;
  base: number;
  boost: number;
  /** Smoothing rate for acceleration (Hz). Higher = snappier. */
  accelRate: number;
  /** Damping factor applied per second when input is released. */
  damping: number;
}
