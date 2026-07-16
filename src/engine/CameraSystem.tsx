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
import { pickTier, profileAtDistance } from "../observer/flight/VelocityProfiles";
import { smoothK } from "../lib/motion";
import { MotionSettingsStore } from "../observer/flight/MotionSettings";
import { FlightState } from "../observer/flight/FlightState";
import { useStage } from "../world/state/stage";

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
  const stage = useStage();

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
  const drift = useRef(new THREE.Vector3()).current;
  const velRef = useRef(new THREE.Vector3());
  // Sangoku charge — 0..1 accumulator, grows while boost is held, decays fast.
  const chargeRef = useRef(0);
  // Rising edge detector for the "impulse tap" kick.
  const prevForward = useRef(0);
  const prevStrafe = useRef(0);
  const prevVertical = useRef(0);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    // Surface stage owns the camera directly (SurfaceScene). Skip all
    // OrbitControls / Director / flight work — the horizon look
    // controller is authoritative until the Observer leaves Earth.
    if (stage === "surface") return;
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
      // Frame-rate independent follow — prevents micro-jitter at low FPS
      // and keeps the pivot stable across variable delta times.
      const kFollow = smoothK(6, delta);
      controls.target.lerp(activeRec.position, kFollow);
      // Adaptive envelope from the body's suggested distances.
      const env = observationEnvelope(activeRec);
      if (controls.minDistance !== env.min) controls.minDistance = env.min;
      if (controls.maxDistance !== env.max) controls.maxDistance = env.max;
      // Ease FOV back to the preset's resting value — interpolated, not snapped.
      const dFov = fov - persp.fov;
      if (Math.abs(dFov) > 0.005) {
        persp.fov += dFov * smoothK(3.5, delta);
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

      // --- Flight translation (Sangoku glide) -----------------------------
      // Vision : la caméra EST l'Observateur. Il glisse. Une simple
      // pression accélère doucement, le relâchement produit un long coast
      // silencieux, et Shift, tenu, charge une hyper-glisse. Le regard
      // infléchit lentement la trajectoire — on va où l'on regarde.
      const settings = MotionSettingsStore.get();
      const pivotDist = camera.position.distanceTo(controls.target);
      const tier = pickTier(pivotDist);
      const profile = profileAtDistance(pivotDist);

      // Boost charge : monte en ~1.4s quand Shift est tenu, redescend en ~0.5s.
      const chargeRate = input.boost && !input.brake ? 0.72 : -2.0;
      chargeRef.current = Math.max(
        0,
        Math.min(1, chargeRef.current + chargeRate * delta),
      );
      const charge = chargeRef.current;
      // Smoothstep : la puissance grimpe doucement puis très fort en fin de charge.
      const chargeCurve = charge * charge * (3 - 2 * charge);
      const hyper = charge > 0.995;

      const brake = input.brake ? 1 : 0;
      // baseSpeed : base → boost → hyperBoost, tout continu, jamais de palier.
      const boostBlend = input.boost && !input.brake ? 1 : 0;
      const sustained =
        profile.base + (profile.boost - profile.base) * boostBlend;
      const peak =
        sustained + (profile.hyperBoost - sustained) * chargeCurve;
      const baseSpeed = peak * settings.sensitivity * (1 - brake * 0.9);

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

      // --- Impulse tap : une pression = une vraie glissée -----------------
      // Détecte les fronts montants (0 → non-zéro) sur chaque axe et injecte
      // un kick directement dans la vélocité. Résultat : un tap donne un
      // coast visible même sans maintenir la touche.
      const KICK = 0.28; // fraction de la vitesse instantanée injectée
      if (input.forward !== 0 && prevForward.current === 0)
        velRef.current.addScaledVector(fwd, input.forward * baseSpeed * KICK);
      if (input.strafe !== 0 && prevStrafe.current === 0)
        velRef.current.addScaledVector(right, input.strafe * baseSpeed * KICK);
      if (input.vertical !== 0 && prevVertical.current === 0)
        velRef.current.addScaledVector(up, input.vertical * baseSpeed * KICK);
      prevForward.current = input.forward;
      prevStrafe.current = input.strafe;
      prevVertical.current = input.vertical;

      // --- Glide vers vitesse désirée (ramp doux) -------------------------
      const accelK = smoothK(profile.accelRate, delta);
      velRef.current.lerp(move, accelK);

      // --- Look-drift : la trajectoire suit lentement le regard -----------
      // On projette la vitesse actuelle sur la direction du regard puis on
      // la ré-oriente doucement (~0.35 Hz). Fluide et instinctif, jamais
      // brutal : on ne "corrige" pas, on infléchit.
      if (hasTranslation && input.forward > 0.01) {
        const speedNow = velRef.current.length();
        if (speedNow > 1e-4) {
          drift.copy(fwd).multiplyScalar(speedNow);
          velRef.current.lerp(drift, smoothK(0.35, delta));
        }
      }

      if (!hasTranslation) {
        // Coast silencieux — glisse très longue, jamais abrupte.
        const damp = Math.pow(profile.damping, delta * 60);
        velRef.current.multiplyScalar(damp);
        if (brake > 0) {
          // Frein progressif — approche zéro souplement, jamais snap.
          velRef.current.multiplyScalar(1 - smoothK(2.0, delta));
        }
      }
      // Seuil très bas : on préserve la sensation de dérive résiduelle.
      if (velRef.current.lengthSq() < 1e-8) velRef.current.set(0, 0, 0);

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
        charge,
        hyper,
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
      enabled={stage === "cosmos"}
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

