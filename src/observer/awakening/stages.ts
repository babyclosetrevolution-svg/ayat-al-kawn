/**
 * Awakening stages — the progressive flight lesson.
 *
 * Each stage owns exactly one elegant hint and a completion predicate
 * driven by the live InputState + flight metrics. Stages disappear forever
 * once their predicate fires; the experience cannot be backtracked.
 */

import type { InputState } from "../flight/types";

export interface StageContext {
  input: InputState;
  /** Smoothed speed coming from the FlightController. */
  speed: number;
  /** Distance from the Observer to the nearest beacon. */
  nearestBeaconDistance: number;
  /** Index of the nearest beacon — used by the "approach" stage. */
  nearestBeaconIndex: number;
  /** Seconds spent in the current stage. */
  elapsed: number;
  /** Cumulative yaw + pitch rotation since stage start (radians). */
  rotated: number;
}

export interface AwakeningStage {
  id: string;
  /** Elegant, contextual one-liner. */
  hint: string;
  /** Returns true when the user has demonstrated mastery of this concept. */
  done: (ctx: StageContext) => boolean;
  /**
   * Minimum dwell time before the stage can complete — even if `done`
   * fires earlier, the hint stays long enough to be read. The experience
   * must never feel rushed.
   */
  minDwellMs: number;
}

export const AWAKENING_STAGES: AwakeningStage[] = [
  {
    id: "awaken",
    hint: "You awaken in the silence between stars.",
    done: (c) => c.elapsed > 4,
    minDwellMs: 4000,
  },
  {
    id: "move",
    hint: "Move forward — press W or ↑",
    done: (c) => c.input.forward > 0 && c.elapsed > 1.2,
    minDwellMs: 2200,
  },
  {
    id: "look",
    hint: "Look around — move the mouse",
    done: (c) => c.rotated > 0.9,
    minDwellMs: 2000,
  },
  {
    id: "slow",
    hint: "Slow down — release the keys, or press X to brake",
    done: (c) => c.speed < 0.6 && c.elapsed > 1.8,
    minDwellMs: 2400,
  },
  {
    id: "free",
    hint: "Glide freely — W A S D, E and Q",
    done: (c) =>
      (Math.abs(c.input.strafe) > 0 || c.input.vertical !== 0) && c.elapsed > 2,
    minDwellMs: 2800,
  },
  {
    id: "focus",
    hint: "A distant light calls — turn to face it",
    done: (c) => c.nearestBeaconIndex >= 0 && c.elapsed > 1.4,
    minDwellMs: 2000,
  },
  {
    id: "approach",
    hint: "Approach the light — hold Shift to boost",
    done: (c) => c.nearestBeaconDistance < 18,
    minDwellMs: 2400,
  },
  {
    id: "observe",
    hint: "Observe. Let yourself be still.",
    done: (c) => c.speed < 0.4 && c.elapsed > 3.2,
    minDwellMs: 3600,
  },
];
