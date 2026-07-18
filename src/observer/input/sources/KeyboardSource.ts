import { InputManager } from "../InputManager";

/**
 * KeyboardSource — Sangoku controls, minimal set.
 *
 *   W / Z / ArrowUp     → glide forward (in the direction you look)
 *   S / ArrowDown       → glide backward
 *   A / Q / ArrowLeft   → strafe left
 *   D / ArrowRight      → strafe right
 *   Space (held)        → accelerate (the longer you hold, the faster)
 *   Shift (held)        → brake / slow down
 *
 * No vertical axis key — you go up/down by looking up/down and gliding
 * forward. That is the whole point of a Sangoku-style free flight: the
 * body follows the gaze.
 */

const KEY_FORWARD = new Set(["KeyW", "KeyZ", "ArrowUp"]);
const KEY_BACK = new Set(["KeyS", "ArrowDown"]);
const KEY_LEFT = new Set(["KeyA", "KeyQ", "ArrowLeft"]);
const KEY_RIGHT = new Set(["KeyD", "ArrowRight"]);
const KEY_BOOST = new Set(["Space"]);
const KEY_BRAKE = new Set(["ShiftLeft", "ShiftRight"]);

export interface KeyboardSourceHandle {
  dispose(): void;
}

export function attachKeyboardSource(): KeyboardSourceHandle {
  const forwardCh = InputManager.allocChannel();
  const strafeCh = InputManager.allocChannel();
  const boostCh = InputManager.allocChannel();
  const brakeCh = InputManager.allocChannel();
  const channels = [forwardCh, strafeCh, boostCh, brakeCh];

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
    // Vertical channel is always zero — kept only for API compatibility.
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
    KEY_RIGHT.has(code) || KEY_BOOST.has(code) || KEY_BRAKE.has(code);

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
