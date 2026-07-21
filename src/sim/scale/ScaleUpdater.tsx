import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { UniverseScaleEngine } from "./UniverseScaleEngine";

/**
 * ScaleUpdater — pousse la position caméra dans l'UniverseScaleEngine
 * une fois par frame. Doit être monté une seule fois, au plus haut de
 * la scène. Aucun autre composant ne doit écrire dans l'engine.
 */
export function ScaleUpdater() {
  const { camera } = useThree();
  const p = new THREE.Vector3();
  useFrame(() => {
    camera.getWorldPosition(p);
    UniverseScaleEngine.update(p);
  });
  return null;
}
