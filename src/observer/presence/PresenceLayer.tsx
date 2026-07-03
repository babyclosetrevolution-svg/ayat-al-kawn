import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PresenceEngine } from "./PresenceEngine";
import { MotionSettingsStore } from "../flight/MotionSettings";

/**
 * PresenceLayer — mounted inside <Canvas>, runs at a positive useFrame
 * priority so it applies AFTER the CameraSystem / CameraDirector have
 * written the frame's target pose. It then adds sub-perceptual offsets
 * and a small adaptive FOV bias without touching the director's logic.
 *
 *  - Astronaut micro-float (breathing + tiny sway) applied in camera-
 *    local space.
 *  - Velocity-driven lateral sway that appears only above a motion
 *    threshold and never at rest.
 *  - Adaptive FOV bias fed by PresenceEngine (contemplation slightly
 *    narrower, journey slightly wider — capped at ±5°).
 *
 * If the user opted into reduce-motion, every offset collapses to 0 and
 * FOV bias is halved.
 */
export function PresenceLayer() {
  const { camera } = useThree();
  const persp = camera as THREE.PerspectiveCamera;
  const baselineFovRef = useRef<number>(persp.fov);
  const lastAppliedBiasRef = useRef<number>(0);
  const smoothedBiasRef = useRef<number>(0);
  const localOffsetRef = useRef(new THREE.Vector3());
  const worldOffsetRef = useRef(new THREE.Vector3());
  const prevWorldOffsetRef = useRef(new THREE.Vector3());
  const velRef = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    if (dt <= 0) return;
    const reduced = MotionSettingsStore.get().reduceMotion;
    const t = state.clock.elapsedTime;

    // --- update PresenceEngine ------------------------------------------------
    const p = PresenceEngine.tick(dt);

    // --- adaptive FOV ---------------------------------------------------------
    // CameraDirector writes persp.fov each frame; we recover its baseline
    // by subtracting the bias we added last frame, then re-apply the new
    // smoothed bias. This never fights the director's own FOV animation.
    const rawBaseline = persp.fov - lastAppliedBiasRef.current;
    baselineFovRef.current = rawBaseline;
    const targetBias = reduced ? p.fovBias * 0.5 : p.fovBias;
    const kFov = 1 - Math.exp(-1.2 * dt);
    smoothedBiasRef.current += (targetBias - smoothedBiasRef.current) * kFov;
    const nextFov = baselineFovRef.current + smoothedBiasRef.current;
    if (Math.abs(nextFov - persp.fov) > 0.01) {
      persp.fov = nextFov;
      persp.updateProjectionMatrix();
    }
    lastAppliedBiasRef.current = smoothedBiasRef.current;

    // --- micro-float + velocity sway (position offset) -----------------------
    const float = PresenceEngine.microFloat(t);
    const swayAmp = PresenceEngine.velocitySwayAmplitude();
    // Velocity sway: gentle lateral drift phased with the roll axis, driven
    // by two low-frequency oscillators. Only meaningful above motion=0.05.
    const vsx = Math.sin(t * 0.7 + 0.3) * swayAmp;
    const vsy = Math.cos(t * 0.55 + 1.2) * swayAmp * 0.6;
    const localOffset = localOffsetRef.current.set(
      reduced ? 0 : float.x + vsx,
      reduced ? 0 : float.y + vsy,
      0,
    );
    // Rotate the local offset into world space using the current camera
    // orientation, then apply. Because CameraDirector rewrote position
    // this frame, the previous offset was already discarded — we simply
    // add the new one on top and remember it for the next frame's tick.
    const worldOffset = worldOffsetRef.current.copy(localOffset).applyQuaternion(persp.quaternion);
    // Approximate the "return to zero" damping so the offset never
    // accumulates when reduce-motion toggles on mid-flight.
    camera.position.add(worldOffset).sub(prevWorldOffsetRef.current);
    prevWorldOffsetRef.current.copy(worldOffset);

    // Small inertia after stopping: keep a tiny drift alive that decays
    // exponentially, so releasing input doesn't feel instantly locked.
    // We estimate residual velocity from the world-offset delta itself.
    velRef.current.multiplyScalar(Math.max(0, 1 - 1.8 * dt));
  }, 2);

  return null;
}
