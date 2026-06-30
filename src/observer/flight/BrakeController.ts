import { smoothK } from "../../lib/motion";

/**
 * BrakeController — smoothly ramps a 0..1 brake factor while X is held.
 * The InertiaModel consumes it through FlightController to glide the
 * velocity toward zero without snapping.
 */

export class BrakeController {
  private level = 0;

  update(active: boolean, dt: number): number {
    const target = active ? 1 : 0;
    const k = smoothK(active ? 5 : 4, dt);
    this.level += (target - this.level) * k;
    if (this.level < 1e-4) this.level = 0;
    return this.level;
  }

  value(): number {
    return this.level;
  }
}
