/**
 * Motion design tokens — single source of truth for animation timing & easing.
 *
 * Every UI surface and the CameraDirector consume these constants so the
 * experience feels uniformly tuned. Tailwind keyframe utilities
 * (`animate-fade-in`, `animate-scale-in`, …) cover declarative cases; this
 * file owns the imperative / R3F side.
 */

export const MOTION = {
  /** Default UI easing — gentle ease-out cubic. */
  ease: [0.22, 0.61, 0.36, 1] as const,
  /** Cinematic camera easing — strong ease-out, slow settle. */
  easeCinematic: [0.16, 0.84, 0.24, 1] as const,
  duration: {
    fast: 180,
    base: 320,
    slow: 600,
    cinematic: 1600,
  },
  /** Exponential smoothing factor — higher = snappier. Used with delta-time. */
  smoothing: {
    ui: 18,
    camera: 1.6,
    cameraTarget: 2.6,
  },
} as const;

/**
 * Frame-rate independent exponential smoothing.
 * Returns the lerp coefficient for a given smoothing rate and delta time.
 */
export function smoothK(rate: number, delta: number): number {
  return 1 - Math.exp(-rate * delta);
}

/** Smooth, S-curve interpolation (0..1). */
export function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}
