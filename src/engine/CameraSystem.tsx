import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../core/config";
import { FocusRegistry, type FocusKey } from "../world/state/focus";
import { CameraDirector } from "./camera/CameraDirector";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { UIState } from "../ui/state/uiState";

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

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { targetPos, cameraPos, fov } = CameraDirector.update(persp, delta);
    controls.target.copy(targetPos);
    camera.position.copy(cameraPos);
    if (Math.abs(persp.fov - fov) > 0.01) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
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

