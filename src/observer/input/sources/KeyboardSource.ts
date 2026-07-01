import { InputManager } from "../InputManager";

/**
 * KeyboardSource — WASD + arrows + Space/E, Shift boost, X brake.
 *
 * Contributes to InputManager on dedicated channels so it composes cleanly
 * with touch, mouse and future gamepad sources.
 */

const KEY_FORWARD = new Set(["KeyW", "ArrowUp"]);
const KEY_BACK = new Set(["KeyS", "ArrowDown"]);
const KEY_LEFT = new Set(["KeyA", "ArrowLeft"]);
const KEY_RIGHT = new Set(["KeyD", "ArrowRight"]);
const KEY_UP = new Set(["KeyE", "Space"]);
const KEY_DOWN = new Set(["KeyQ"]);
const KEY_BOOST = new Set(["ShiftLeft", "ShiftRight"]);
const KEY_BRAKE = new Set(["KeyX"]);

export interface KeyboardSourceHandle {
  dispose(): void;
}

export function attachKeyboardSource(): KeyboardSourceHandle {
  const forwardCh = InputManager.allocChannel();
  const strafeCh = InputManager.allocChannel();
  const verticalCh = InputManager.allocChannel();
  const boostCh = InputManager.allocChannel();
  const brakeCh = InputManager.allocChannel();
  const channels = [forwardCh, strafeCh, verticalCh, boostCh, brakeCh];

  const pressed = new Set<string>();

  const recompute = () => {
    let f = 0;
    for (const k of pressed) {
      if (KEY_FORWARD.has(k)) f += 1;
      if (KEY_BACK.has(k)) f -= 1;
    }
    InputManager.setAxis("forward", forwardCh, f);
    let s = 0;
    for (const k of pressed) {
      if (KEY_RIGHT.has(k)) s += 1;
      if (KEY_LEFT.has(k)) s -= 1;
    }
    InputManager.setAxis("strafe", strafeCh, s);
    let v = 0;
    for (const k of pressed) {
      if (KEY_UP.has(k)) v += 1;
      if (KEY_DOWN.has(k)) v -= 1;
    }
    InputManager.setAxis("vertical", verticalCh, v);
    let boost = false;
    let brake = false;
    for (const k of pressed) {
      if (KEY_BOOST.has(k)) boost = true;
      if (KEY_BRAKE.has(k)) brake = true;
    }
    InputManager.setBool("boost", boostCh, boost);
    InputManager.setBool("brake", brakeCh, brake);
  };

  const isNavKey = (code: string) =>
    KEY_FORWARD.has(code) || KEY_BACK.has(code) || KEY_LEFT.has(code) ||
    KEY_RIGHT.has(code) || KEY_UP.has(code) || KEY_DOWN.has(code) ||
    KEY_BOOST.has(code) || KEY_BRAKE.has(code);

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.repeat) return;
    if (isNavKey(ev.code)) {
      // Prevent Space from scrolling the page etc.
      ev.preventDefault();
    }
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

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  return {
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      channels.forEach((c) => InputManager.clearChannel(c));
    },
  };
}
