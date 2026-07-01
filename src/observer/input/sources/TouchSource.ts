import { InputManager } from "../InputManager";

/**
 * TouchSource — pluggable API for the on-screen touch controls.
 *
 * Two logical inputs:
 *  - "move"  : virtual joystick (left thumb) → normalized vector [-1..1]²
 *              maps to strafe (x) + forward (-y).
 *  - "look"  : drag pad (right thumb) → per-frame deltas in pixels; we
 *              scale them into radians here.
 *
 * The React component (TouchControls) owns pointer capture and merely
 * forwards values through this API — the source stays engine-agnostic.
 */

const LOOK_GAIN = 0.005;

export interface TouchSourceHandle {
  setMove(x: number, y: number): void;
  addLook(dxPx: number, dyPx: number): void;
  setBoost(on: boolean): void;
  setBrake(on: boolean): void;
  dispose(): void;
}

export function attachTouchSource(): TouchSourceHandle {
  const strafeCh = InputManager.allocChannel();
  const forwardCh = InputManager.allocChannel();
  const boostCh = InputManager.allocChannel();
  const brakeCh = InputManager.allocChannel();

  return {
    setMove(x, y) {
      // Joystick coordinates: x right, y down (screen). Invert y so up = forward.
      InputManager.setAxis("strafe", strafeCh, Math.max(-1, Math.min(1, x)));
      InputManager.setAxis("forward", forwardCh, Math.max(-1, Math.min(1, -y)));
    },
    addLook(dxPx, dyPx) {
      InputManager.addLook(dxPx * LOOK_GAIN, dyPx * LOOK_GAIN);
    },
    setBoost(on) {
      InputManager.setBool("boost", boostCh, on);
    },
    setBrake(on) {
      InputManager.setBool("brake", brakeCh, on);
    },
    dispose() {
      [strafeCh, forwardCh, boostCh, brakeCh].forEach((c) =>
        InputManager.clearChannel(c),
      );
    },
  };
}
