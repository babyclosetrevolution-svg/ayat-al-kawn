import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { FocusRegistry } from "../state/focus";
import { EARTH_POSITION } from "./Earth";

/**
 * Moon — small companion to Earth.
 * Realistic albedo, tidally-locked rotation (same period as orbit),
 * orbits Earth slowly so the scene feels alive without being busy.
 */
const MOON_RADIUS = 0.55;
const MOON_DISTANCE = 7;
const MOON_TEX = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/moon_1024.jpg";

export function Moon() {
  const pivotRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const map = useLoader(THREE.TextureLoader, MOON_TEX);
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
  }, [map]);

  useMemo(() => {
    // Initial position; updated each frame as it orbits.
    FocusRegistry.register("moon", {
      position: EARTH_POSITION.clone().add(new THREE.Vector3(MOON_DISTANCE, 0, 0)),
      distance: MOON_RADIUS * 6,
    });
  }, []);

  useFrame((_, delta) => {
    if (pivotRef.current) {
      pivotRef.current.rotation.y += delta * 0.06; // orbit
      // Update registered position for camera focus tracking.
      const rec = FocusRegistry.get("moon");
      if (rec && meshRef.current) {
        meshRef.current.getWorldPosition(rec.position);
      }
    }
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.06; // tidal lock
  });

  return (
    <group ref={pivotRef} position={EARTH_POSITION}>
      <mesh
        ref={meshRef}
        position={[MOON_DISTANCE, 0, 0]}
        userData={{ focusKey: "moon" }}
      >
        <sphereGeometry args={[MOON_RADIUS, 96, 96]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
