/**
 * Observer Engine — the living entity of AYAT AL-KAWN.
 *
 * The Observer owns position, orientation, velocity, acceleration, movement
 * state, focus state and awareness state. The Camera becomes a component
 * attached to the Observer through CameraAttachment.
 *
 * Scientific, rendering, knowledge, discovery, encyclopedia and science
 * modules are intentionally untouched — the Observer composes their
 * outputs and exposes a coherent state stream consumed by the HUD and
 * future systems (Memory, Routine, Passages, Effects, Corridors).
 */

export { Observer } from "./core/Observer";
export { Presence } from "./presence/PresenceState";
export { PresenceEngine } from "./presence/PresenceEngine";
export { PresenceLayer } from "./presence/PresenceLayer";
export { MotionField } from "./effects/MotionField";
export { CameraAttachment } from "./camera/CameraAttachment";
export { ObserverHUD } from "./ui/ObserverHUD";
export { FlightHUD } from "./ui/FlightHUD";
export { FlightOnboarding } from "./ui/FlightOnboarding";
export { useObserver } from "./hooks/useObserver";
export { useObserverMode } from "./hooks/useObserverMode";
export { CorridorRegistry } from "./navigation/Corridors";
export { RoutineRegistry } from "./routine";
export { PassageRegistry } from "./passages";
export { EffectRegistry } from "./effects";
export { ObserverMemory } from "./memory";
export type {
  ObserverMode,
  ObserverState,
  ObserverKinematics,
  ObserverAwareness,
  Vec3,
  Quat,
} from "./types";
