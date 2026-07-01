import { InputManager } from "../InputManager";

/**
 * PointerSource — mouse look. Works in TWO modes seamlessly:
 *  - pointer-locked : movementX/Y drives look continuously (FPS style).
 *  - drag-to-look   : holding the primary button and dragging rotates the
 *                     view. This is a fallback for browsers or contexts
 *                     where pointer lock cannot be requested.
 *
 * Never requires pointer lock upfront — the FlightController stays fully
 * playable with keyboard alone. A caller may still request the lock for
 * a more immersive experience.
 */

const LOOK_GAIN = 0.0022;

export interface PointerSourceHandle {
  setLockTarget(el: HTMLElement | null): void;
  requestPointerLock(): void;
  releasePointerLock(): void;
  isLocked(): boolean;
  dispose(): void;
}

export function attachPointerSource(): PointerSourceHandle {
  let lockTarget: HTMLElement | null = null;
  let locked = false;
  let dragging = false;

  const onMouseMove = (ev: MouseEvent) => {
    if (locked) {
      InputManager.addLook(ev.movementX * LOOK_GAIN, ev.movementY * LOOK_GAIN);
      return;
    }
    if (dragging) {
      InputManager.addLook(ev.movementX * LOOK_GAIN, ev.movementY * LOOK_GAIN);
    }
  };
  const onMouseDown = (ev: MouseEvent) => {
    if (ev.button !== 0) return;
    if (!locked) dragging = true;
  };
  const onMouseUp = () => {
    dragging = false;
  };
  const onLockChange = () => {
    locked = document.pointerLockElement === lockTarget;
    if (locked) dragging = false;
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("blur", onMouseUp);
  document.addEventListener("pointerlockchange", onLockChange);

  return {
    setLockTarget(el) {
      lockTarget = el;
    },
    requestPointerLock() {
      if (!lockTarget || locked) return;
      try {
        lockTarget.requestPointerLock();
      } catch {
        /* requires a user gesture; caller retries on interaction */
      }
    },
    releasePointerLock() {
      if (locked) {
        try {
          document.exitPointerLock();
        } catch {
          /* ignore */
        }
      }
    },
    isLocked() {
      return locked;
    },
    dispose() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", onMouseUp);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (locked) {
        try {
          document.exitPointerLock();
        } catch {
          /* ignore */
        }
      }
    },
  };
}
