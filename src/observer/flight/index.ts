/**
 * Flight module — the Observer glides.
 *
 * Composition (no duplication of camera, input or movement logic):
 *  - InputMapping       → keyboard + pointer-lock plumbing
 *  - MotionSettings     → persisted preferences (sensitivity, invert, reduce)
 *  - VelocityProfiles   → adaptive speed tiers
 *  - InertiaModel       → smooth acceleration + damping
 *  - RotationController → smoothed yaw/pitch with tiny inertia
 *  - BoostController    → held-Shift ramp
 *  - BrakeController    → held-X ramp
 *  - ComfortController  → look shaping + vignette + reduce-motion bias
 *  - FlightController   → integrates the above per frame
 */

export { FlightController } from "./FlightController";
export { InertiaModel } from "./InertiaModel";
export { RotationController } from "./RotationController";
export { BoostController } from "./BoostController";
export { BrakeController } from "./BrakeController";
export { ComfortController } from "./ComfortController";
export { bindInputs, FlightKeys, type InputBindingHandle } from "./InputMapping";
export { MotionSettingsStore, DEFAULT_MOTION_SETTINGS } from "./MotionSettings";
export { PROFILES, blendProfiles, pickTier, profileAtDistance } from "./VelocityProfiles";
export type {
  InputState,
  MotionSettings,
  VelocityProfile,
  FlightTier,
} from "./types";
