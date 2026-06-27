import * as THREE from "three";
import type { RingsDef } from "../types/CelestialBody";

/**
 * RingLayer — prepared for Saturn/Uranus/Neptune. Unused in Phase 3.
 *
 * Intentionally kept texture-less for now to avoid conditional hook usage;
 * a future revision will swap in a `useTexture` branch when first consumed.
 */
export function RingLayer({ rings }: { rings: RingsDef }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[rings.innerRadius, rings.outerRadius, 128]} />
      <meshBasicMaterial
        color={new THREE.Color(rings.color ?? "#ffffff")}
        transparent
        opacity={rings.opacity ?? 0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
