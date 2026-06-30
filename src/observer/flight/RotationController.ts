import * as THREE from "three";
import { smoothK } from "../../lib/motion";

/**
 * RotationController — converts accumulated yaw/pitch deltas into a
 * smoothed quaternion. Adds a tiny rotational inertia so the look never
 * snaps. Roll is always zero (no barrel rolls — the experience must feel
 * stable and meditative).
 */

const HALF_PI = Math.PI / 2;
const PITCH_LIMIT = HALF_PI - 0.05;

export class RotationController {
  yaw = 0;
  pitch = 0;
  private targetYaw = 0;
  private targetPitch = 0;
  private quat = new THREE.Quaternion();
  private euler = new THREE.Euler(0, 0, 0, "YXZ");

  setFromQuaternion(q: THREE.Quaternion) {
    this.quat.copy(q);
    this.euler.setFromQuaternion(q, "YXZ");
    this.yaw = this.targetYaw = this.euler.y;
    this.pitch = this.targetPitch = this.euler.x;
  }

  /**
   * Consume accumulated mouse deltas (in radians). Caller is responsible
   * for honoring invertX/invertY and sensitivity before passing here.
   */
  consume(deltaYaw: number, deltaPitch: number) {
    this.targetYaw -= deltaYaw;
    this.targetPitch -= deltaPitch;
    if (this.targetPitch > PITCH_LIMIT) this.targetPitch = PITCH_LIMIT;
    if (this.targetPitch < -PITCH_LIMIT) this.targetPitch = -PITCH_LIMIT;
  }

  /** Smoothly approach target orientation. Returns the live quaternion. */
  update(dt: number, rate = 22): THREE.Quaternion {
    const k = smoothK(rate, dt);
    this.yaw += (this.targetYaw - this.yaw) * k;
    this.pitch += (this.targetPitch - this.pitch) * k;
    this.euler.set(this.pitch, this.yaw, 0, "YXZ");
    this.quat.setFromEuler(this.euler);
    return this.quat;
  }

  quaternion(): THREE.Quaternion {
    return this.quat;
  }
}
