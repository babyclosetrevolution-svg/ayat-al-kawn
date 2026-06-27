import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { CloudsDef } from "../types/CelestialBody";

/**
 * CloudLayer — independent rotating sphere slightly above the surface.
 * Reusable for any planet exposing a cloud texture.
 */
export function CloudLayer({
  radius,
  clouds,
}: {
  radius: number;
  clouds: CloudsDef;
}) {
  const map = useLoader(THREE.TextureLoader, clouds.texture);
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
  }, [map]);

  const meshRef = useRef<THREE.Mesh>(null);
  const speed = (clouds.speed ?? 1) * 0.04;

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * speed;
  });

  return (
    <mesh ref={meshRef} scale={clouds.scale ?? 1.015}>
      <sphereGeometry args={[radius, 96, 96]} />
      <meshPhongMaterial
        map={map}
        transparent
        opacity={clouds.opacity ?? 0.55}
        depthWrite={false}
      />
    </mesh>
  );
}
