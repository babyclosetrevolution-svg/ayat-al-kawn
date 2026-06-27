import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { PlanetMaterial } from "../materials/PlanetMaterial";
import { useOrbit, useRotation } from "../../sim";

/**
 * Moon — generic satellite. Orbit and spin are both delegated to the
 * simulation layer: a pivot at the parent origin carries the orbital
 * motion, and the mesh carries axial rotation. Tidal lock is just the
 * default case where both periods match.
 */
export function Moon({ data }: { data: CelestialBodyData }) {
  const pivotRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const distance = data.orbit?.distance ?? 0;
  const phase = data.orbit?.phase ?? 0;
  const inclination = ((data.orbit?.inclination ?? 0) * Math.PI) / 180;

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: new THREE.Vector3(distance, 0, 0),
      distance: data.radius * (data.focusDistanceFactor ?? 6),
    });
  }, [data, distance]);

  useOrbit(pivotRef, {
    parentId: data.orbit?.parentId ?? "",
    radius: distance,
    period: data.orbit?.period ?? data.rotationPeriod,
    inclination: data.orbit?.inclination,
    phase,
    enabled: Boolean(data.orbit),
  });

  useRotation(meshRef, { period: data.rotationPeriod });

  // Publish live world-space position for the camera each render frame.
  useFrame(() => {
    const rec = FocusRegistry.get(data.id);
    if (rec && meshRef.current) meshRef.current.getWorldPosition(rec.position);
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
