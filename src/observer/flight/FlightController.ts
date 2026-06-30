import * as THREE from "three";
import { InertiaModel } from "./InertiaModel";
import { RotationController } from "./RotationController";
import { BoostController } from "./BoostController";
import { BrakeController } from "./BrakeController";
import { ComfortController } from "./ComfortController";
import { MotionSettingsStore } from "./MotionSettings";
import { PROFILES, blendProfiles, pickTier } from "./VelocityProfiles";
import type { InputState, FlightTier, VelocityProfile } from "./types";
import { Observer } from "../core/Observer";
import { smoothK } from "../../lib/motion";

/**
 * FlightController — composes inertia, rotation, boost, brake and comfort
 * into a single per-frame update that mutates a camera in place. Adaptive
 * speed is achieved by smoothly blending between four velocity profiles
 * keyed by distance to the current focus.
 *
 * The controller is engine-agnostic: it drives any PerspectiveCamera
 * passed to `apply()`. The CameraAttachment continues to feed pose into
 * the Observer state stream, so velocity/acceleration in the HUD stay
 * coherent without duplicating logic.
 */

export class FlightController {
  private inertia = new InertiaModel();
  private rotation = new RotationController();
  private boost = new BoostController();
  private brake = new BrakeController();
  private comfort = new ComfortController();
  private profile: VelocityProfile = PROFILES.medium;
  private tier: FlightTier = "medium";
  private desired = new THREE.Vector3();
  private forwardV = new THREE.Vector3();
  private rightV = new THREE.Vector3();
  private upV = new THREE.Vector3(0, 1, 0);

  initFromCamera(camera: THREE.Camera) {
    this.rotation.setFromQuaternion(camera.quaternion);
    this.inertia.reset();
  }

  setTier(tier: FlightTier) {
    this.tier = tier;
  }

  currentTier(): FlightTier {
    return this.tier;
  }

  currentSpeed(): number {
    return this.inertia.velocity().length();
  }

  vignette(): number {
    return this.comfort.vignetteLevel();
  }

  /**
   * Per-frame integration.
   * @param input live input state (mutated yaw/pitch are consumed here).
   * @param camera the camera to drive.
   * @param distanceToFocus optional distance to the current focus, used
   *        for adaptive speed; pass null to keep the current tier.
   */
  apply(
    input: InputState,
    camera: THREE.PerspectiveCamera,
    dt: number,
    distanceToFocus: number | null,
  ) {
    if (dt <= 0) return;
    const settings = MotionSettingsStore.get();

    // --- adaptive tier blend -------------------------------------------------
    if (distanceToFocus != null) {
      const target = pickTier(distanceToFocus);
      if (target !== this.tier) {
        // 1s blend toward new profile to avoid abrupt speed jumps.
        const blended = blendProfiles(
          this.profile,
          PROFILES[target],
          smoothK(1.2, dt),
        );
        this.profile = blended;
        // Snap tier label once we're close enough to target.
        const ref = PROFILES[target];
        if (Math.abs(blended.base - ref.base) / Math.max(ref.base, 1) < 0.05) {
          this.profile = ref;
          this.tier = target;
        }
      } else {
        this.profile = PROFILES[target];
      }
    }

    // --- look ----------------------------------------------------------------
    const [dy, dp] = this.comfort.shapeLook(input.yaw, input.pitch, settings);
    input.yaw = 0;
    input.pitch = 0;
    this.rotation.consume(dy, dp);
    const orient = this.rotation.update(dt, 22);
    camera.quaternion.copy(orient);

    // --- desired translation in world space ---------------------------------
    this.forwardV.set(0, 0, -1).applyQuaternion(orient);
    this.rightV.set(1, 0, 0).applyQuaternion(orient);
    const boostLevel = this.boost.update(input.boost && !input.brake, dt);
    const brakeLevel = this.brake.update(input.brake, dt);
    const baseSpeed =
      this.profile.base * settings.sensitivity * (1 - brakeLevel) +
      (this.profile.boost - this.profile.base) * boostLevel * (1 - brakeLevel);

    this.desired.set(0, 0, 0);
    if (input.forward !== 0)
      this.desired.addScaledVector(this.forwardV, input.forward * baseSpeed);
    if (input.strafe !== 0)
      this.desired.addScaledVector(this.rightV, input.strafe * baseSpeed);
    if (input.vertical !== 0)
      this.desired.addScaledVector(this.upV, input.vertical * baseSpeed);

    // --- inertia + brake -----------------------------------------------------
    const accel = this.comfort.shapeAccelRate(this.profile.accelRate, settings);
    this.inertia.update(this.desired, accel, this.profile.damping, dt);
    if (brakeLevel > 0.05) this.inertia.brake(2.4 * brakeLevel, dt);

    // --- integrate position --------------------------------------------------
    const v = this.inertia.velocity();
    camera.position.addScaledVector(v, dt);

    // --- comfort vignette ----------------------------------------------------
    this.comfort.updateVignette(v.length(), this.profile.base, dt);
  }

  /** Inform the Observer of the active flight mode (state machine helper). */
  publishMode(mode: Parameters<typeof Observer.setMode>[0]) {
    Observer.setMode(mode);
  }
}
