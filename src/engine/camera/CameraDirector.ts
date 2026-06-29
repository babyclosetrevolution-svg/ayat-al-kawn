import * as THREE from "three";
import type { CameraPreset } from "./CameraPresets";
import { CAMERA_PRESETS, pickPreset } from "./CameraPresets";
import { FocusRegistry, type FocusKey } from "../../world/state/focus";
import { CatalogManager } from "../../sim";
import { smoothK } from "../../lib/motion";

/**
 * CameraDirector — cinematic camera brain.
 *
 * Responsibilities:
 *  - Resolve the active focus into a desired pose using a category preset.
 *  - Track the live target position (orbiting bodies keep moving).
 *  - Apply smooth, frame-rate independent easing for both position & target,
 *    with target anticipation (target lerps faster than the camera so the
 *    framing leads instead of lags).
 *  - Add a subtle idle drift + vertical breathing when the user isn't
 *    interacting, so the scene never feels frozen.
 *
 * The CameraSystem owns OrbitControls and pointer input; the Director only
 * computes the desired pose each tick. This keeps responsibilities clean
 * and the Director independently testable.
 */

export interface DirectorUpdate {
  targetPos: THREE.Vector3;
  cameraPos: THREE.Vector3;
  fov: number;
  preset: CameraPreset;
}

class CameraDirectorImpl {
  /** Desired pose recomputed each frame. */
  private desiredTarget = new THREE.Vector3();
  private desiredCamera = new THREE.Vector3();

  /** Current smoothed pose — what the CameraSystem applies to OrbitControls. */
  private currentTarget = new THREE.Vector3();
  private currentCamera = new THREE.Vector3();

  /** Stored offset (camera relative to target) for the active focus. */
  private offsetDir = new THREE.Vector3(0, 0.3, 1).normalize();
  private offsetLen = 30;

  private activePreset: CameraPreset = CAMERA_PRESETS.planet;
  private currentFov = 55;

  private elapsed = 0;
  private interactingUntil = 0;
  private initialized = false;
  private reducedMotion = false;

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  /** Called by CameraSystem whenever the user manipulates OrbitControls. */
  markInteraction() {
    this.interactingUntil = this.elapsed + 1.4;
  }

  /** Capture the existing camera/target pose so transitions feel continuous. */
  bootstrap(camera: THREE.PerspectiveCamera, target: THREE.Vector3) {
    this.currentCamera.copy(camera.position);
    this.currentTarget.copy(target);
    this.currentFov = camera.fov;
    this.initialized = true;
  }

  /**
   * Called when focus changes — recomputes the desired pose & preset, keeping
   * the user's current viewing angle so we glide instead of cutting.
   */
  onFocusChanged(key: FocusKey, camera: THREE.PerspectiveCamera) {
    if (!key) return;
    const rec = FocusRegistry.get(key);
    if (!rec) return;

    // Pick preset by checking each catalog the focus might belong to.
    const solar = CatalogManager.get("solar-system") ?? [];
    const stars = CatalogManager.get("stars") ?? [];
    const galaxies = CatalogManager.get("galaxies") ?? [];
    const solarBody = solar.find((b) => b.id === key);
    const starBody = stars.find((b) => b.id === key);
    const galaxyBody = galaxies.find((g) => g.id === key);
    const kind = galaxyBody ? "galaxy" : (solarBody?.type ?? starBody?.type);
    this.activePreset = pickPreset(kind);

    // Preserve viewing direction; otherwise use preset elevation/offset.
    const fromCamera = new THREE.Vector3().subVectors(
      camera.position,
      this.currentTarget,
    );
    if (fromCamera.lengthSq() > 0.0001) {
      this.offsetDir.copy(fromCamera).normalize();
    } else {
      this.offsetDir
        .set(this.activePreset.offset, this.activePreset.elevation, 1)
        .normalize();
    }
    this.offsetLen = rec.distance * this.activePreset.distanceFactor;
  }

  /** Per-frame update. Returns the smoothed pose for application by the caller. */
  update(camera: THREE.PerspectiveCamera, delta: number): DirectorUpdate {
    this.elapsed += delta;

    if (!this.initialized) this.bootstrap(camera, this.currentTarget);

    const key = FocusRegistry.getActive();
    const rec = key ? FocusRegistry.get(key) : undefined;

    if (rec) {
      this.desiredTarget.copy(rec.position);

      // Idle cinematic motion — subtle drift around the target + breathing.
      const idle = this.elapsed > this.interactingUntil && !this.reducedMotion;
      const dir = this.offsetDir.clone();
      if (idle) {
        const angle = this.elapsed * this.activePreset.idleDrift;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = dir.x * c - dir.z * s;
        const z = dir.x * s + dir.z * c;
        dir.set(x, dir.y, z);
      }
      this.desiredCamera
        .copy(rec.position)
        .addScaledVector(dir, this.offsetLen);
      if (idle) {
        const breath =
          Math.sin(this.elapsed * 0.35) * this.activePreset.breathing;
        this.desiredCamera.y += breath * this.offsetLen;
      }
    } else {
      this.desiredTarget.copy(this.currentTarget);
      this.desiredCamera.copy(this.currentCamera);
    }

    // Smooth easing — target leads, camera follows (anticipation).
    // Rate is modulated by remaining travel: long journeys accelerate
    // mid-flight, then naturally decelerate near the destination so the
    // user perceives both the distance and the arrival.
    const baseRate = this.reducedMotion ? 8 : this.activePreset.transitionRate;
    const remaining = this.currentCamera.distanceTo(this.desiredCamera);
    const settleScale = Math.max(0.0001, this.offsetLen);
    const proximity = THREE.MathUtils.clamp(remaining / (settleScale * 6), 0, 1);
    // Eased boost: x²(3-2x). Up to ~1.8× rate at long range, 1× near target.
    const ease = proximity * proximity * (3 - 2 * proximity);
    const travelRate = baseRate * (1 + ease * 0.8);
    const kCam = smoothK(travelRate, delta);
    const kTarget = smoothK(travelRate * 1.8, delta);

    this.currentTarget.lerp(this.desiredTarget, kTarget);
    this.currentCamera.lerp(this.desiredCamera, kCam);

    // Smooth FOV blending — slight widening during long travel so the
    // sense of speed reads even in deep space.
    const targetFov = this.activePreset.fov + ease * 4;
    this.currentFov += (targetFov - this.currentFov) * kCam;

    return {
      targetPos: this.currentTarget,
      cameraPos: this.currentCamera,
      fov: this.currentFov,
      preset: this.activePreset,
    };
  }
}

export const CameraDirector = new CameraDirectorImpl();
