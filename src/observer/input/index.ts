/**
 * Observer Input Module — device-agnostic action layer.
 *
 * The FlightController and onboarding both consume InputManager.state
 * (which follows the same InputState shape as before). Sources translate
 * physical devices into shared action channels.
 */

export { InputManager } from "./InputManager";
export { attachKeyboardSource } from "./sources/KeyboardSource";
export { attachPointerSource, type PointerSourceHandle } from "./sources/PointerSource";
export { attachTouchSource, type TouchSourceHandle } from "./sources/TouchSource";
export { TouchControls, useIsTouchDevice } from "./TouchControls";
