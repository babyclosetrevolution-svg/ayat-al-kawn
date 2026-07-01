/**
 * InputManager — device-agnostic action state.
 *
 * All input sources (keyboard, mouse, touch, trackpad, gamepad) write into
 * a single shared state. The FlightController and onboarding read from
 * that state without ever knowing which physical device produced it.
 *
 * Actions
 *   - MoveForward / MoveBackward    (translation forward axis)
 *   - StrafeLeft  / StrafeRight     (translation lateral axis)
 *   - MoveUp      / MoveDown        (translation vertical axis)
 *   - Boost                          (held modifier)
 *   - Brake                          (held modifier)
 *   - Look                           (yaw + pitch deltas in radians)
 *
 * Sources register a contribution channel (numeric id) and push values on
 * that channel; the resulting axis is the sum clamped to [-1, 1]. This
 * lets multiple devices coexist — e.g. keyboard + joystick — without one
 * overwriting the other.
 */

import type { InputState } from "../flight/types";

export type ActionAxis =
  | "forward"
  | "strafe"
  | "vertical";

export type ActionBool = "boost" | "brake";

type Channels = Map<number, number>;

const positiveChans: Record<ActionAxis, Channels> = {
  forward: new Map(),
  strafe: new Map(),
  vertical: new Map(),
};
const negativeChans: Record<ActionAxis, Channels> = {
  forward: new Map(),
  strafe: new Map(),
  vertical: new Map(),
};
const boolChans: Record<ActionBool, Set<number>> = {
  boost: new Set(),
  brake: new Set(),
};

const state: InputState = {
  forward: 0,
  strafe: 0,
  vertical: 0,
  boost: false,
  brake: false,
  yaw: 0,
  pitch: 0,
};

let lastInputAt = 0;
let nextChannelId = 1;

function sum(m: Channels): number {
  let s = 0;
  for (const v of m.values()) s += v;
  return s;
}

function recomputeAxes() {
  const axes: ActionAxis[] = ["forward", "strafe", "vertical"];
  for (const a of axes) {
    const v = sum(positiveChans[a]) - sum(negativeChans[a]);
    state[a] = Math.max(-1, Math.min(1, v));
  }
  state.boost = boolChans.boost.size > 0;
  state.brake = boolChans.brake.size > 0;
}

function stamp() {
  lastInputAt = performance.now();
}

export const InputManager = {
  /** Allocate a channel id for a source. Sources use one id per direction. */
  allocChannel(): number {
    return nextChannelId++;
  },
  /**
   * Push a positive contribution [0..1] on an axis for this channel.
   * Passing 0 clears the channel.
   */
  setAxisPositive(axis: ActionAxis, channel: number, value: number) {
    const v = Math.max(0, Math.min(1, value));
    if (v === 0) positiveChans[axis].delete(channel);
    else positiveChans[axis].set(channel, v);
    recomputeAxes();
    if (v > 0) stamp();
  },
  setAxisNegative(axis: ActionAxis, channel: number, value: number) {
    const v = Math.max(0, Math.min(1, value));
    if (v === 0) negativeChans[axis].delete(channel);
    else negativeChans[axis].set(channel, v);
    recomputeAxes();
    if (v > 0) stamp();
  },
  /** Convenience: signed value in [-1..1]. */
  setAxis(axis: ActionAxis, channel: number, value: number) {
    if (value >= 0) {
      InputManager.setAxisNegative(axis, channel, 0);
      InputManager.setAxisPositive(axis, channel, value);
    } else {
      InputManager.setAxisPositive(axis, channel, 0);
      InputManager.setAxisNegative(axis, channel, -value);
    }
  },
  setBool(action: ActionBool, channel: number, on: boolean) {
    if (on) {
      boolChans[action].add(channel);
      stamp();
    } else {
      boolChans[action].delete(channel);
    }
    recomputeAxes();
  },
  /** Accumulate look deltas in radians. Consumed by the FlightController. */
  addLook(dyaw: number, dpitch: number) {
    state.yaw += dyaw;
    state.pitch += dpitch;
    if (dyaw !== 0 || dpitch !== 0) stamp();
  },
  /** Reset every channel — used when a source disposes or window blurs. */
  clearChannel(channel: number) {
    for (const a of ["forward", "strafe", "vertical"] as ActionAxis[]) {
      positiveChans[a].delete(channel);
      negativeChans[a].delete(channel);
    }
    for (const b of ["boost", "brake"] as ActionBool[])
      boolChans[b].delete(channel);
    recomputeAxes();
  },
  /** Wipe every source. Useful on hard reset. */
  reset() {
    for (const a of ["forward", "strafe", "vertical"] as ActionAxis[]) {
      positiveChans[a].clear();
      negativeChans[a].clear();
    }
    for (const b of ["boost", "brake"] as ActionBool[]) boolChans[b].clear();
    state.yaw = 0;
    state.pitch = 0;
    recomputeAxes();
  },
  /** Live shared state consumed by the FlightController. */
  state,
  /** Milliseconds since the last non-zero input from any source. */
  msSinceLastInput(): number {
    return performance.now() - lastInputAt;
  },
  markInteraction() {
    stamp();
  },
};
