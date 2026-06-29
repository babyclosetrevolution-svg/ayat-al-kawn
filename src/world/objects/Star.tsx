import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { EmissiveStarMaterial } from "../materials/EmissiveStarMaterial";
import { SolarCorona } from "../../render/SolarCorona";
import { useRotation } from "../../sim";

/**
 * Star — generic emissive body.
 *
 * Axial spin is delegated to the simulation layer (`useRotation`) so global
 * pause / time scaling apply uniformly. Visual presentation is composed
 * from three layers:
 *   1. emissive surface (procedural plasma shader)
 *   2. corona shell + camera-facing glare (rendering layer)
 *   3. legacy data-driven halos, kept as soft fallback tints
 */
export function Star({ data }: { data: CelestialBodyData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => new THREE.Vector3(...(data.position ?? [0, 0, 0])),
    [data],
  );

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: pos.clone(),
      distance: data.radius * (data.focusDistanceFactor ?? 4),
    });
  }, [data, pos]);

  useRotation(meshRef, { period: data.rotationPeriod });

  const e = data.emissive;

  return (
    <group position={pos}>
      {e?.lightColor && (
        <pointLight
          color={e.lightColor}
          intensity={e.lightIntensity ?? 4}
          distance={0}
          decay={0}
        />
      )}
      <mesh ref={meshRef} userData={{ focusKey: data.id }}>
        <sphereGeometry args={[data.radius, 96, 96]} />
        <EmissiveStarMaterial />
      </mesh>
      <SolarCorona radius={data.radius} color={e?.color} />
      {e?.halos?.map((h, i) => (
        <mesh key={i} scale={h.scale}>
          <sphereGeometry args={[data.radius, 48, 48]} />
          <meshBasicMaterial
            color={new THREE.Color(h.color)}
            transparent
            opacity={h.opacity * 0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
