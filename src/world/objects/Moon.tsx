import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { PlanetMaterial } from "../materials/PlanetMaterial";

/**
 * Moon — generic satellite. Orbits its parent via a pivot group placed at
 * the parent's local origin; tidal-lock is the default (rotationPeriod ===
 * orbital period) but any rotationPeriod value is honoured.
 */
export function Moon({ data }: { data: CelestialBodyData }) {
  const pivotRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const omega = (2 * Math.PI) / data.rotationPeriod;
  const orbitOmega = data.orbit ? (2 * Math.PI) / data.orbit.period : 0;
  const distance = data.orbit?.distance ?? 0;
  const phase = data.orbit?.phase ?? 0;
  const inclination = ((data.orbit?.inclination ?? 0) * Math.PI) / 180;

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: new THREE.Vector3(distance, 0, 0),
      distance: data.radius * (data.focusDistanceFactor ?? 6),
    });
  }, [data, distance]);

  useFrame((_, dt) => {
    if (pivotRef.current) {
      pivotRef.current.rotation.y += dt * orbitOmega;
      const rec = FocusRegistry.get(data.id);
      if (rec && meshRef.current) meshRef.current.getWorldPosition(rec.position);
    }
    if (meshRef.current) meshRef.current.rotation.y += dt * omega;
  });

  return (
    <group ref={pivotRef} rotation={[inclination, phase, 0]}>
      <mesh
        ref={meshRef}
        position={[distance, 0, 0]}
        userData={{ focusKey: data.id }}
      >
        <sphereGeometry args={[data.radius, 96, 96]} />
        <PlanetMaterial material={data.material} textures={data.textures} />
      </mesh>
    </group>
  );
}
