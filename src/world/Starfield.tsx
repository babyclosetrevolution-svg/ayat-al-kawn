import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../core/config";

/**
 * Starfield — procedural deep-space background.
 * Generates points on a thick spherical shell with subtle color temperature variation
 * so the sky reads as real starlight rather than uniform white noise.
 */
export function Starfield() {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const { count, radius, depth } = ENGINE_CONFIG.starfield;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Uniform distribution on a sphere, then jitter radius for shell depth.
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius + (Math.random() - 0.5) * depth;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Color temperature: mostly cool white, occasional warm/blue accents.
      const t = Math.random();
      if (t < 0.7) tmp.setHSL(0.6, 0.05, 0.85 + Math.random() * 0.15);
      else if (t < 0.9) tmp.setHSL(0.58, 0.4, 0.7 + Math.random() * 0.2);
      else tmp.setHSL(0.08, 0.5, 0.7 + Math.random() * 0.2);

      colors[i * 3 + 0] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;

      // Power-law size: many small stars, few bright ones.
      sizes[i] = Math.pow(Math.random(), 6) * 3 + 0.4;
    }
    return { positions, colors, sizes };
  }, []);

  // Extremely slow rotation gives a sense of cosmic drift without distracting.
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={ENGINE_CONFIG.starfield.baseSize}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
