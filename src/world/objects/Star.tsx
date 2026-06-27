import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { EmissiveStarMaterial } from "../materials/EmissiveStarMaterial";

/**
 * Star — generic emissive body. Every star in the universe is an instance
 * of this component; behaviour is fully driven by `data`.
 */
export function Star({ data }: { data: CelestialBodyData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => new THREE.Vector3(...(data.position ?? [0, 0, 0])),
    [data],
  );
  const omega = (2 * Math.PI) / data.rotationPeriod;

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: pos.clone(),
      distance: data.radius * (data.focusDistanceFactor ?? 4),
    });
  }, [data, pos]);

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * omega;
  });

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
      {e?.halos?.map((h, i) => (
        <mesh key={i} scale={h.scale}>
          <sphereGeometry args={[data.radius, 48, 48]} />
          <meshBasicMaterial
            color={new THREE.Color(h.color)}
            transparent
            opacity={h.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      ))}
    </group>
  );
}
