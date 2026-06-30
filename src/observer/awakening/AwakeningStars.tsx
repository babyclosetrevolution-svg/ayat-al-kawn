import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * AwakeningStars — a calm, sparse starfield used only inside the
 * Awakening scene. Independent from the main Starfield to avoid touching
 * any scientific module. Stars rotate very slowly to suggest presence.
 */
export function AwakeningStars({ count = 4500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Spherical shell.
      const r = 1400 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const hue = 0.58 + (Math.random() - 0.5) * 0.08;
      c.setHSL(hue, 0.25, 0.55 + Math.random() * 0.3);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.003;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={1.2}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * DistantSun — the final reveal. A bright warm sphere with a soft glow
 * sphere that becomes visible as the Awakening concludes.
 */
export function DistantSun({ opacity }: { opacity: number }) {
  const position: [number, number, number] = [0, 0, -1600];
  if (opacity <= 0.001) return null;
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[42, 32, 32]} />
        <meshBasicMaterial color={"#ffe9a8"} transparent opacity={opacity} />
      </mesh>
      <mesh>
        <sphereGeometry args={[110, 32, 32]} />
        <meshBasicMaterial
          color={"#ffc874"}
          transparent
          opacity={opacity * 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[260, 32, 32]} />
        <meshBasicMaterial
          color={"#ff9c4a"}
          transparent
          opacity={opacity * 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
