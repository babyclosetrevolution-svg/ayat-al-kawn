import { smoothK } from "../../lib/motion";

/**
 * BoostController — smoothly ramps a 0..1 boost factor. Held Shift pulls
 * the factor toward 1; release relaxes it back to 0. The FlightController
 * uses it to blend between profile.base and profile.boost.
 */

export class BoostController {
  private level = 0;

  update(active: boolean, dt: number): number {
    const target = active ? 1 : 0;
    const k = smoothK(active ? 2.2 : 3.0, dt);
    this.level += (target - this.level) * k;
    if (this.level < 1e-4) this.level = 0;
    return this.level;
  }

  value(): number {
    return this.level;
  }
}
