import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FocusRegistry } from "../state/focus";

/**
 * Sun — primary light source.
 * Emissive sphere with a procedural noise shader for subtle surface motion,
 * plus a soft additive glow halo. A PointLight at its center lights the scene.
 */
const SUN_RADIUS = 6;
const SUN_POSITION = new THREE.Vector3(-180, 30, -120);

const surfaceVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const surfaceFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float uTime;

  // Simple value noise.
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }

  void main() {
    vec3 p = vPos * 0.25 + vec3(0.0, uTime * 0.04, 0.0);
    float n = noise(p) * 0.6 + noise(p * 2.3) * 0.3 + noise(p * 5.1) * 0.1;
    vec3 cold = vec3(1.0, 0.55, 0.15);
    vec3 hot  = vec3(1.0, 0.95, 0.75);
    vec3 col = mix(cold, hot, smoothstep(0.35, 0.85, n));
    // Limb brightening on the rim.
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 1.5);
    col += vec3(1.0, 0.7, 0.35) * rim * 0.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Sun() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // Register focus target once.
  useMemo(() => {
    FocusRegistry.register("sun", {
      position: SUN_POSITION.clone(),
      distance: SUN_RADIUS * 4,
    });
  }, []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.02;
  });

  return (
    <group position={SUN_POSITION}>
      {/* Light cast onto the rest of the scene. */}
      <pointLight intensity={4.5} distance={0} decay={0} color={0xfff1d0} />
      <mesh ref={meshRef} userData={{ focusKey: "sun" }}>
        <sphereGeometry args={[SUN_RADIUS, 96, 96]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={surfaceVert}
          fragmentShader={surfaceFrag}
          toneMapped={false}
        />
      </mesh>
      {/* Inner glow */}
      <mesh scale={1.08}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color={0xffc869}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Outer halo */}
      <mesh scale={1.35}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color={0xff9a3c}
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

export { SUN_POSITION };
