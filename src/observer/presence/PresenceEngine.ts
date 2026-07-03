import { Observer } from "../core/Observer";

/**
 * PresenceEngine — the Universe feels alive around the Observer.
 *
 * Pure kinematics-driven module. Reads the Observer's smoothed speed and
 * emits three signals used by the render / audio / motion layers:
 *
 *   • layer         — semantic velocity band (contemplation / exploration /
 *                     journey). Existing FlightController tiers are kept
 *                     untouched; PresenceEngine only *labels* them.
 *   • fovBias       — small additive bias applied to the current camera
 *                     FOV (contemplation slightly narrower, journey wider).
 *   • motion        — 0..1 intensity used by the MotionField and audio.
 *   • breath, sway  — tiny oscillators for the astronaut-float effect.
 *
 * All coefficients are intentionally sub-perceptual at rest — presence
 * should be felt, never noticed.
 */

export type PresenceLayer = "contemplation" | "exploration" | "journey";

interface PresenceState {
  layer: PresenceLayer;
  /** Normalized motion 0..1 (smoothed). */
  motion: number;
  /** Additive FOV bias in degrees (approx. -3 .. +5). */
  fovBias: number;
}

const LAYER_ORDER: PresenceLayer[] = ["contemplation", "exploration", "journey"];

const CONFIG = {
  // Speed thresholds (world units / second). Chosen to feel natural given
  // the four FlightController tiers. Overlap = smooth transition zone.
  contemplationMax: 3,
  explorationMax: 60,
  // FOV biases, in degrees.
  fovContemplation: -3,
  fovExploration: 0,
  fovJourney: 5,
  // Motion perception thresholds — invisible below `motionOn`.
  motionOn: 8,
  motionFull: 400,
  // Smoothing rate (Hz).
  smoothRate: 1.8,
  // Astronaut-float coefficients — offsets in world units.
  breathAmp: 0.008,
  swayAmp: 0.014,
  velSwayAmp: 0.02,
};

class PresenceEngineImpl {
  private state: PresenceState = { layer: "exploration", motion: 0, fovBias: 0 };
  private smoothedSpeed = 0;
  private listeners = new Set<(s: PresenceState) => void>();

  get(): PresenceState {
    return this.state;
  }

  subscribe(cb: (s: PresenceState) => void): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Per-frame tick. Called by PresenceLayer inside the R3F frame loop.
   * Returns the fresh state so callers can avoid an extra `.get()`.
   */
  tick(dt: number): PresenceState {
    const speed = Observer.get().speed;
    const k = 1 - Math.exp(-CONFIG.smoothRate * Math.max(dt, 0.0001));
    this.smoothedSpeed += (speed - this.smoothedSpeed) * k;
    const s = this.smoothedSpeed;

    // Layer classification with hysteresis-free smoothed input.
    let layer: PresenceLayer;
    if (s < CONFIG.contemplationMax) layer = "contemplation";
    else if (s < CONFIG.explorationMax) layer = "exploration";
    else layer = "journey";

    // Continuous FOV bias — interpolate across the two boundaries so
    // there's never an audible step when a tier flips.
    let fovBias: number;
    if (s < CONFIG.contemplationMax) {
      const t = clamp01(s / CONFIG.contemplationMax);
      fovBias = lerp(CONFIG.fovContemplation, CONFIG.fovExploration, t);
    } else if (s < CONFIG.explorationMax) {
      const t = clamp01((s - CONFIG.contemplationMax) / (CONFIG.explorationMax - CONFIG.contemplationMax));
      fovBias = lerp(CONFIG.fovExploration, CONFIG.fovExploration, t);
    } else {
      const t = clamp01((s - CONFIG.explorationMax) / (CONFIG.explorationMax * 6));
      fovBias = lerp(CONFIG.fovExploration, CONFIG.fovJourney, t);
    }

    // Motion sensation ramp.
    const motion = clamp01((s - CONFIG.motionOn) / (CONFIG.motionFull - CONFIG.motionOn));

    if (layer !== this.state.layer) {
      this.state = { layer, motion, fovBias };
      for (const l of this.listeners) l(this.state);
    } else {
      this.state = { layer, motion, fovBias };
    }
    return this.state;
  }

  /** Sub-perceptual float offsets in the camera local frame. */
  microFloat(t: number): { x: number; y: number; z: number } {
    // Two very slow independent oscillators — never harmonic.
    const bx = Math.sin(t * 0.19) * CONFIG.breathAmp;
    const by = Math.sin(t * 0.13 + 1.7) * CONFIG.breathAmp * 1.4;
    const sx = Math.sin(t * 0.44 + 0.6) * CONFIG.swayAmp * 0.5;
    const sy = Math.sin(t * 0.31 + 2.1) * CONFIG.swayAmp * 0.4;
    return { x: bx + sx, y: by + sy, z: 0 };
  }

  /** Velocity-dependent lateral sway amplitude, 0..1 (scaled by motion). */
  velocitySwayAmplitude(): number {
    return this.state.motion * CONFIG.velSwayAmp;
  }

  currentLayerIndex(): number {
    return LAYER_ORDER.indexOf(this.state.layer);
  }
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const PresenceEngine = new PresenceEngineImpl();
