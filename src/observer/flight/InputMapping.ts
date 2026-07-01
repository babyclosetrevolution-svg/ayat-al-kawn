import type { InputState } from "./types";
import { InputManager } from "../input/InputManager";
import {
  attachKeyboardSource,
  type KeyboardSourceHandle,
} from "../input/sources/KeyboardSource";
import {
  attachPointerSource,
  type PointerSourceHandle,
} from "../input/sources/PointerSource";

/**
 * InputMapping — legacy compatibility shim.
 *
 * The real state now lives in InputManager (device-agnostic action layer).
 * This module simply attaches keyboard + pointer sources and exposes the
 * same handle surface previous callers relied on. Touch and future gamepad
 * sources live under src/observer/input/ and can be attached independently.
 */

export interface InputBindingHandle {
  /** Live action state — same shape the FlightController already consumes. */
  state: InputState;
  setPointerLockTarget(el: HTMLElement | null): void;
  requestPointerLock(): void;
  releasePointerLock(): void;
  isPointerLocked(): boolean;
  dispose(): void;
}

let keyboardCount = 0;
let keyboard: KeyboardSourceHandle | null = null;

function acquireKeyboard(): KeyboardSourceHandle {
  if (!keyboard) keyboard = attachKeyboardSource();
  keyboardCount++;
  return keyboard;
}
function releaseKeyboard() {
  keyboardCount = Math.max(0, keyboardCount - 1);
  if (keyboardCount === 0 && keyboard) {
    keyboard.dispose();
    keyboard = null;
  }
}

export function bindInputs(): InputBindingHandle {
  acquireKeyboard();
  const pointer: PointerSourceHandle = attachPointerSource();

  return {
    state: InputManager.state,
    setPointerLockTarget(el) {
      pointer.setLockTarget(el);
    },
    requestPointerLock() {
      pointer.requestPointerLock();
    },
    releasePointerLock() {
      pointer.releasePointerLock();
    },
    isPointerLocked() {
      return pointer.isLocked();
    },
    dispose() {
      pointer.dispose();
      releaseKeyboard();
    },
  };
}

// Kept for backward compatibility — used by nothing critical, but exported.
export const FlightKeys = {
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  up: ["KeyE", "Space"],
  down: ["KeyQ"],
  boost: ["ShiftLeft", "ShiftRight"],
  brake: ["KeyX"],
};
