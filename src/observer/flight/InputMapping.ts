import type { InputState } from "./types";

/**
 * InputMapping — keyboard + pointer plumbing. Returns a live InputState
 * object that the FlightController reads each frame. Pointer-lock is
 * requested only on demand (the awakening enables it when the user is
 * ready to look around).
 */

export interface InputBindingHandle {
  state: InputState;
  setPointerLockTarget(el: HTMLElement | null): void;
  requestPointerLock(): void;
  releasePointerLock(): void;
  dispose(): void;
}

const KEY_FORWARD = ["KeyW", "ArrowUp"];
const KEY_BACK = ["KeyS", "ArrowDown"];
const KEY_LEFT = ["KeyA", "ArrowLeft"];
const KEY_RIGHT = ["KeyD", "ArrowRight"];
const KEY_UP = ["KeyE", "Space"];
const KEY_DOWN = ["KeyQ", "ShiftLeft"]; // ShiftLeft acts as boost — see special handling
const KEY_BOOST = ["ShiftLeft", "ShiftRight"];
const KEY_BRAKE = ["KeyX"];

function makeEmpty(): InputState {
  return {
    forward: 0,
    strafe: 0,
    vertical: 0,
    boost: false,
    brake: false,
    yaw: 0,
    pitch: 0,
  };
}

export function bindInputs(): InputBindingHandle {
  const state = makeEmpty();
  const pressed = new Set<string>();
  let lockTarget: HTMLElement | null = null;
  let locked = false;

  const recompute = () => {
    state.forward =
      (KEY_FORWARD.some((k) => pressed.has(k)) ? 1 : 0) -
      (KEY_BACK.some((k) => pressed.has(k)) ? 1 : 0);
    state.strafe =
      (KEY_RIGHT.some((k) => pressed.has(k)) ? 1 : 0) -
      (KEY_LEFT.some((k) => pressed.has(k)) ? 1 : 0);
    state.vertical =
      (pressed.has("KeyE") || pressed.has("Space") ? 1 : 0) -
      (pressed.has("KeyQ") ? 1 : 0);
    state.boost = KEY_BOOST.some((k) => pressed.has(k));
    state.brake = KEY_BRAKE.some((k) => pressed.has(k));
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.repeat) return;
    pressed.add(ev.code);
    recompute();
  };
  const onKeyUp = (ev: KeyboardEvent) => {
    pressed.delete(ev.code);
    recompute();
  };
  const onBlur = () => {
    pressed.clear();
    recompute();
  };

  const onMouseMove = (ev: MouseEvent) => {
    if (!locked) return;
    // 0.0022 rad/px feels close to consumer FPS look sensitivity.
    state.yaw += ev.movementX * 0.0022;
    state.pitch += ev.movementY * 0.0022;
  };

  const onLockChange = () => {
    locked = document.pointerLockElement === lockTarget;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("mousemove", onMouseMove);
  document.addEventListener("pointerlockchange", onLockChange);

  return {
    state,
    setPointerLockTarget(el) {
      lockTarget = el;
    },
    requestPointerLock() {
      if (lockTarget && !locked) {
        try {
          lockTarget.requestPointerLock();
        } catch {
          /* user gesture required — caller handles */
        }
      }
    },
    releasePointerLock() {
      if (locked) document.exitPointerLock();
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (locked) document.exitPointerLock();
    },
  };
}

export const FlightKeys = {
  forward: KEY_FORWARD,
  back: KEY_BACK,
  left: KEY_LEFT,
  right: KEY_RIGHT,
  up: KEY_UP,
  down: KEY_DOWN,
  boost: KEY_BOOST,
  brake: KEY_BRAKE,
};
