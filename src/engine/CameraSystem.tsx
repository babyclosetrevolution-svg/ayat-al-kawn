import { OrbitControls } from "@react-three/drei";
import { ENGINE_CONFIG } from "../core/config";

/**
 * CameraSystem — encapsulates camera controls.
 * Phase 1 uses OrbitControls. Later phases can swap in cinematic rigs
 * (flight, focus-target, scripted tours) without touching the Engine.
 */
export function CameraSystem() {
  return (
    <OrbitControls
      makeDefault
      enableDamping={ENGINE_CONFIG.controls.enableDamping}
      dampingFactor={ENGINE_CONFIG.controls.dampingFactor}
      rotateSpeed={ENGINE_CONFIG.controls.rotateSpeed}
      zoomSpeed={ENGINE_CONFIG.controls.zoomSpeed}
      minDistance={ENGINE_CONFIG.controls.minDistance}
      maxDistance={ENGINE_CONFIG.controls.maxDistance}
      enablePan={false}
    />
  );
}
