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

/** Joystick tuning — matches the keyboard glide feel. */
const JOY_DEADZONE = 0.18;
/** Response curve exponent; >1 = softer near center, faster at the edge. */
const JOY_CURVE = 1.65;

function shapeAxis(v: number): number {
  const abs = Math.abs(v);
  if (abs <= JOY_DEADZONE) return 0;
  // Rescale [deadzone..1] → [0..1] then apply the curve.
  const t = (abs - JOY_DEADZONE) / (1 - JOY_DEADZONE);
  const curved = Math.pow(Math.min(1, t), JOY_CURVE);
  return Math.sign(v) * curved;
}

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
      // Deadzone + curve give the keyboard's on/off feel while keeping fine
      // control for slow contemplative glides.
      InputManager.setAxis("strafe", strafeCh, shapeAxis(x));
      InputManager.setAxis("forward", forwardCh, shapeAxis(-y));
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
