import { smoothK } from "../../lib/motion";
import type { MotionSettings } from "./types";

/**
 * ComfortController — keeps motion gentle. Caps yaw/pitch rates, softens
 * acceleration when reduceMotion is enabled, and exposes a 0..1 vignette
 * intensity the overlay can use during high-speed travel.
 */

export class ComfortController {
  private vignette = 0;

  /** Scale yaw/pitch deltas to respect reduceMotion + sensitivity. */
  shapeLook(
    deltaYaw: number,
    deltaPitch: number,
    settings: MotionSettings,
  ): [number, number] {
    const s = settings.lookSensitivity * (settings.reduceMotion ? 0.6 : 1);
    const y = deltaYaw * s * (settings.invertX ? -1 : 1);
    const p = deltaPitch * s * (settings.invertY ? -1 : 1);
    return [y, p];
  }

  /** Scale acceleration rates to keep motion soft under reduceMotion. */
  shapeAccelRate(rate: number, settings: MotionSettings): number {
    return settings.reduceMotion ? rate * 0.7 : rate;
  }

  /** Update the vignette intensity based on current speed and tier base. */
  updateVignette(speed: number, base: number, dt: number): number {
    const ratio = base > 0 ? Math.min(1, speed / (base * 2.5)) : 0;
    const target = ratio * ratio;
    const k = smoothK(2, dt);
    this.vignette += (target - this.vignette) * k;
    return this.vignette;
  }

  vignetteLevel(): number {
    return this.vignette;
  }
}
