import * as THREE from "three";
import { smoothK } from "../../lib/motion";

/**
 * InertiaModel — translates desired translation into a smoothly accelerated
 * velocity vector. Captures the "glide" feel: long acceleration ramp,
 * gentle exponential damping when input is released.
 */

export class InertiaModel {
  private vel = new THREE.Vector3();
  private tmp = new THREE.Vector3();

  reset() {
    this.vel.set(0, 0, 0);
  }

  velocity(): THREE.Vector3 {
    return this.vel;
  }

  /**
   * @param desired desired velocity in world units / second.
   * @param accelRate smoothing rate (Hz).
   * @param damping per-second damping when desired is ~zero.
   * @param dt delta time in seconds.
   */
  update(desired: THREE.Vector3, accelRate: number, damping: number, dt: number) {
    if (dt <= 0) return this.vel;
    const k = smoothK(accelRate, dt);
    this.vel.lerp(desired, k);
    if (desired.lengthSq() < 1e-6) {
      // Exponential damping toward zero.
      const d = Math.pow(damping, dt * 60);
      this.vel.multiplyScalar(d);
      if (this.vel.lengthSq() < 1e-8) this.vel.set(0, 0, 0);
    }
    return this.vel;
  }

  /** Hard brake — quickly approach zero without snapping. */
  brake(strength: number, dt: number) {
    const k = smoothK(strength, dt);
    this.tmp.set(0, 0, 0);
    this.vel.lerp(this.tmp, k);
    if (this.vel.lengthSq() < 1e-8) this.vel.set(0, 0, 0);
  }
}
