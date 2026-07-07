import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../core/config";
import { FocusRegistry, observationEnvelope, type FocusKey } from "../world/state/focus";
import { CameraDirector } from "./camera/CameraDirector";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { UIState } from "../ui/state/uiState";
import { InputManager } from "../observer/input/InputManager";
import { attachKeyboardSource } from "../observer/input/sources/KeyboardSource";
import { PROFILES, pickTier } from "../observer/flight/VelocityProfiles";
import { MotionSettingsStore } from "../observer/flight/MotionSettings";
import { FlightState } from "../observer/flight/FlightState";

/**
 * CameraSystem — thin runtime around OrbitControls + CameraDirector.
 *
 *  - OrbitControls handles damped pointer input.
 *  - CameraDirector computes the cinematic desired pose every frame
 *    (preset framing, easing, anticipation, idle drift, breathing).
 *  - Double-clicking any mesh carrying `userData.focusKey` re-targets focus.
 */
export function CameraSystem() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl, scene } = useThree();
  const persp = camera as THREE.PerspectiveCamera;
  const reduced = usePrefersReducedMotion();

  useEffect(() => CameraDirector.setReducedMotion(reduced), [reduced]);

  // Refocus the Director when the active body changes.
  useEffect(() => {
    const sync = (key: FocusKey) => CameraDirector.onFocusChanged(key, persp);
    const unsub = FocusRegistry.subscribe(sync);
    // Initial pull after objects register (next frame).
    const id = setTimeout(() => {
      CameraDirector.bootstrap(
        persp,
        controlsRef.current?.target ?? new THREE.Vector3(),
      );
      sync(FocusRegistry.getActive());
    }, 60);
    return () => {
      unsub();
      clearTimeout(id);
    };
  }, [persp]);

  // User pointer activity → suppress idle drift briefly and notify UIState
  // so floating panels fade out while the user is hand-flying the camera.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      CameraDirector.markInteraction();
      UIState.setActivity("navigating");
    };
    const onChange = () => CameraDirector.markInteraction();
    controls.addEventListener("start", onStart);
    controls.addEventListener("change", onChange);
    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("change", onChange);
    };
  }, []);

  // Focus changes — the Director is about to fly the camera. Treat as a
  // cinematic transition so the rest of the UI gets out of the way.
  useEffect(() => {
    return FocusRegistry.subscribe(() => UIState.setActivity("cinematic"));
  }, []);

  // Double-click → focus the clicked celestial body.
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onDbl = (ev: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          const key = (obj.userData?.focusKey ?? null) as FocusKey;
          if (key) {
            FocusRegistry.setActive(key);
            return;
          }
          obj = obj.parent;
        }
      }
    };
    gl.domElement.addEventListener("dblclick", onDbl);
    return () => gl.domElement.removeEventListener("dblclick", onDbl);
  }, [camera, gl, scene]);

  // Attach the shared keyboard source so WASD / arrows / Space / Shift / X
  // feed InputManager. The FlightSystem below reads the resulting axes.
  useEffect(() => {
    const src = attachKeyboardSource();
    return () => src.dispose();
  }, []);

  // Scratch vectors reused across frames (allocation-free hot path).
  const fwd = useRef(new THREE.Vector3()).current;
  const right = useRef(new THREE.Vector3()).current;
  const up = useRef(new THREE.Vector3(0, 1, 0)).current;
  const move = useRef(new THREE.Vector3()).current;
  const velRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { targetPos, cameraPos, fov } = CameraDirector.update(persp, delta);
    const mode = CameraDirector.getMode();
    const activeKey = FocusRegistry.getActive();
    const activeRec = activeKey ? FocusRegistry.get(activeKey) : undefined;
    const input = InputManager.state;
    const hasTranslation =
      input.forward !== 0 || input.strafe !== 0 || input.vertical !== 0;

    // Flight escape hatch — any translation input during observation lets
    // the Observer drift free of the focused body. The Director will
    // return to idle on the next frame once focus is cleared.
    if (mode === "observation" && hasTranslation) {
      FocusRegistry.setActive(null);
    }

    if (mode === "journey") {
      // Cinematic arrival — Director drives target + position + FOV.
      controls.target.copy(targetPos);
      camera.position.copy(cameraPos);
      if (Math.abs(persp.fov - fov) > 0.01) {
        persp.fov = fov;
        persp.updateProjectionMatrix();
      }
      velRef.current.set(0, 0, 0);
    } else if (mode === "observation" && activeRec) {
      // Body-locked orbital camera. OrbitControls owns rotation/zoom;
      // we only keep the pivot glued to the (possibly orbiting) body.
      controls.target.lerp(activeRec.position, 0.35);
      // Adaptive envelope from the body's suggested distances.
      const env = observationEnvelope(activeRec);
      if (controls.minDistance !== env.min) controls.minDistance = env.min;
      if (controls.maxDistance !== env.max) controls.maxDistance = env.max;
      // Ease FOV back to the preset's resting value.
      if (Math.abs(persp.fov - fov) > 0.01) {
        persp.fov = fov;
        persp.updateProjectionMatrix();
      }
      velRef.current.set(0, 0, 0);
    } else {
      // Idle / contemplation — OrbitControls owns rotation & zoom; the
      // Observer flight layer adds translation (WASD / joystick) on top.
      if (controls.minDistance !== ENGINE_CONFIG.controls.minDistance) {
        controls.minDistance = ENGINE_CONFIG.controls.minDistance;
      }
      if (controls.maxDistance !== ENGINE_CONFIG.controls.maxDistance) {
        controls.maxDistance = ENGINE_CONFIG.controls.maxDistance;
      }

      // --- Flight translation --------------------------------------------
      // Adaptive speed keyed by camera-to-pivot distance, so the Observer
      // glides at planetary scales near a body and at interstellar scales
      // in deep space. Reuses the existing velocity profile table.
      const settings = MotionSettingsStore.get();
      const pivotDist = camera.position.distanceTo(controls.target);
      const tier = pickTier(pivotDist);
      const profile = PROFILES[tier];
      const boost = input.boost ? 1 : 0;
      const brake = input.brake ? 1 : 0;
      const baseSpeed =
        (profile.base + (profile.boost - profile.base) * boost) *
        settings.sensitivity *
        (1 - brake * 0.85);

      // Desired velocity in world space (camera-relative axes).
      persp.getWorldDirection(fwd);
      right.copy(fwd).cross(up).normalize();
      move.set(0, 0, 0);
      if (input.forward !== 0)
        move.addScaledVector(fwd, input.forward * baseSpeed);
      if (input.strafe !== 0)
        move.addScaledVector(right, input.strafe * baseSpeed);
      if (input.vertical !== 0)
        move.addScaledVector(up, input.vertical * baseSpeed);

      // Smoothly accelerate toward desired velocity (glide, not snap).
      const accelK = 1 - Math.exp(-profile.accelRate * delta);
      velRef.current.lerp(move, accelK);
      if (!hasTranslation) {
        const damp = Math.pow(profile.damping, delta * 60);
        velRef.current.multiplyScalar(damp);
        if (brake > 0) velRef.current.multiplyScalar(1 - 0.6 * delta * 6);
      }
      if (velRef.current.lengthSq() < 1e-6) velRef.current.set(0, 0, 0);

      // Translate both camera and pivot so OrbitControls keeps its bearing.
      if (velRef.current.lengthSq() > 0) {
        const step = move.copy(velRef.current).multiplyScalar(delta);
        camera.position.add(step);
        controls.target.add(step);
        CameraDirector.markInteraction();
        if (hasTranslation) UIState.setActivity("navigating");
      }

      CameraDirector.bootstrap(persp, controls.target);
      FlightState.set({
        tier,
        speed: velRef.current.length(),
        focused: false,
        translating: hasTranslation,
      });
    }

    if (mode === "journey" || mode === "observation") {
      // Keep the HUD aware of what's happening even outside flight.
      const pivotDist = camera.position.distanceTo(controls.target);
      FlightState.set({
        tier: pickTier(pivotDist),
        speed: 0,
        focused: true,
        translating: false,
      });
    }
    controls.update();
  });


  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={ENGINE_CONFIG.controls.enableDamping}
      dampingFactor={ENGINE_CONFIG.controls.dampingFactor}
      rotateSpeed={ENGINE_CONFIG.controls.rotateSpeed}
      zoomSpeed={ENGINE_CONFIG.controls.zoomSpeed}
      minDistance={ENGINE_CONFIG.controls.minDistance}
      maxDistance={ENGINE_CONFIG.controls.maxDistance}
      // Prevent disorienting flips while keeping free orbit comfortable.
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI - 0.18}
      enablePan
    />
  );
}

