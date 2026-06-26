import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../core/config";
import { FocusRegistry, type FocusKey } from "../world/state/focus";

/**
 * CameraSystem — cinematic orbit/zoom/pan with smooth focus transitions.
 *
 *  - OrbitControls provides damped orbit + zoom + pan.
 *  - Active focus target is read from FocusRegistry each frame; the controls'
 *    target and the camera position are lerped toward it so transitions feel
 *    filmic rather than snappy.
 *  - Double-clicking any mesh with userData.focusKey re-targets that object.
 */
export function CameraSystem() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl, scene } = useThree();
  const desiredTarget = useRef(new THREE.Vector3());
  const desiredCamPos = useRef(new THREE.Vector3());
  const hasDesired = useRef(false);

  // Establish initial desired pose from the active focus target once registered.
  useEffect(() => {
    const sync = (key: FocusKey) => {
      if (!key) return;
      const rec = FocusRegistry.get(key);
      if (!rec) return;
      desiredTarget.current.copy(rec.position);
      // Offset camera relative to current viewing direction so we keep the user's angle.
      const dir = new THREE.Vector3()
        .subVectors(camera.position, controlsRef.current?.target ?? new THREE.Vector3())
        .normalize();
      if (dir.lengthSq() < 0.001) dir.set(0, 0.3, 1).normalize();
      desiredCamPos.current
        .copy(rec.position)
        .add(dir.multiplyScalar(rec.distance));
      hasDesired.current = true;
    };
    const unsub = FocusRegistry.subscribe(sync);
    // Initial pull (after objects register).
    const id = setTimeout(() => sync(FocusRegistry.getActive()), 60);
    return () => {
      unsub();
      clearTimeout(id);
    };
  }, [camera]);

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

  // Smoothly track the active target's live position and the desired camera pose.
  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const key = FocusRegistry.getActive();
    if (key) {
      const rec = FocusRegistry.get(key);
      if (rec) {
        desiredTarget.current.copy(rec.position);
        // Keep camera at the offset captured when focus was set, but follow the moving target.
        if (!hasDesired.current) {
          desiredCamPos.current
            .copy(rec.position)
            .add(new THREE.Vector3(0, rec.distance * 0.3, rec.distance));
          hasDesired.current = true;
        }
      }
    }
    if (hasDesired.current) {
      const k = 1 - Math.pow(0.001, delta); // frame-rate independent ease
      controls.target.lerp(desiredTarget.current, k * 0.9);
      camera.position.lerp(desiredCamPos.current, k * 0.5);
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
      enablePan
    />
  );
}
