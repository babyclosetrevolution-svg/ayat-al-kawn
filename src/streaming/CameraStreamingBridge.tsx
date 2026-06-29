import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { StreamingManager } from "./StreamingManager";

/**
 * CameraStreamingBridge — feeds camera position into StreamingManager
 * at a low frequency. Mounted inside the R3F Canvas; no scene output.
 */
export function CameraStreamingBridge() {
  const { camera } = useThree();
  const accum = useRef(0);
  const last = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  useFrame((_, delta) => {
    accum.current += delta;
    if (accum.current < 0.25) return; // 4 Hz is plenty for region decisions
    accum.current = 0;
    if (camera.position.distanceTo(last.current) < 0.5) return;
    last.current.copy(camera.position);
    StreamingManager.notifyCamera(camera.position);
  });

  return null;
}
