import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { Observer } from "../core/Observer";
import { integrate, resetMovement } from "../movement/MovementController";
import { FocusRegistry } from "../../world/state/focus";

/**
 * CameraAttachment — the camera becomes a component attached to the
 * Observer. The existing CameraSystem / CameraDirector continue to drive
 * the actual three.js camera (no rendering or scientific module changes);
 * this attachment reads the camera pose each frame and feeds it into the
 * Observer so velocity, acceleration and awareness stay coherent.
 *
 * Mounted inside the Engine's <Canvas> tree.
 */
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();

export function CameraAttachment() {
  const { camera } = useThree();

  useEffect(() => {
    resetMovement();
    const unsub = FocusRegistry.subscribe((k) => {
      Observer.setFocus(k);
      Observer.markInteraction();
    });
    Observer.setFocus(FocusRegistry.getActive());
    return unsub;
  }, []);

  useFrame((_, dt) => {
    camera.getWorldPosition(tmpPos);
    camera.getWorldQuaternion(tmpQuat);
    integrate(tmpPos, tmpQuat, dt);
    Observer.flush();
  });

  return null;
}
