import * as THREE from "three";
import { Observer } from "../core/Observer";

/**
 * MovementController — physically-inspired motion model for the Observer.
 *
 * The existing CameraDirector still drives cinematic framing during focus
 * transitions; this controller layers smooth acceleration, inertia and
 * velocity damping on top of the *resulting* camera pose, so the Observer
 * exposes velocity/acceleration consistent with what the user perceives.
 *
 * Tunables live in MOVEMENT_TUNING and can later be overridden by
 * configurable sensitivity profiles without touching call sites.
 */

export const MOVEMENT_TUNING = {
  /** How quickly velocity tracks the instantaneous pose delta (Hz). */
  velocityRate: 6,
  /** How quickly acceleration tracks velocity change (Hz). */
  accelerationRate: 4,
  /** Exponential damping applied to velocity at rest (per second). */
  damping: 0.92,
  /** Minimum reportable speed to avoid jitter in the HUD. */
  speedFloor: 1e-3,
} as const;

const prevPos = new THREE.Vector3();
const prevVel = new THREE.Vector3();
const tmpVel = new THREE.Vector3();
const tmpAcc = new THREE.Vector3();
let initialized = false;

function smoothK(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/**
 * Integrate one frame. Pass the camera's world position + orientation; the
 * controller derives velocity/acceleration and writes them to the Observer.
 */
export function integrate(
  pos: THREE.Vector3,
  quat: THREE.Quaternion,
  dt: number,
) {
  if (!initialized || dt <= 0) {
    prevPos.copy(pos);
    prevVel.set(0, 0, 0);
    initialized = true;
    Observer.updateKinematics(
      { x: pos.x, y: pos.y, z: pos.z },
      { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      0,
    );
    return;
  }

  // Instantaneous velocity → smoothed toward.
  tmpVel.subVectors(pos, prevPos).divideScalar(dt);
  const kV = smoothK(MOVEMENT_TUNING.velocityRate, dt);
  prevVel.lerp(tmpVel, kV);
  // Inertial damping when motion stalls.
  prevVel.multiplyScalar(MOVEMENT_TUNING.damping);

  // Acceleration = derivative of smoothed velocity.
  tmpAcc.subVectors(tmpVel, prevVel).divideScalar(Math.max(dt, 1e-4));
  const kA = smoothK(MOVEMENT_TUNING.accelerationRate, dt);
  tmpAcc.multiplyScalar(kA);

  const speed = prevVel.length();
  Observer.updateKinematics(
    { x: pos.x, y: pos.y, z: pos.z },
    { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
    { x: prevVel.x, y: prevVel.y, z: prevVel.z },
    { x: tmpAcc.x, y: tmpAcc.y, z: tmpAcc.z },
    speed < MOVEMENT_TUNING.speedFloor ? 0 : speed,
  );

  prevPos.copy(pos);
}

export function resetMovement() {
  initialized = false;
}
