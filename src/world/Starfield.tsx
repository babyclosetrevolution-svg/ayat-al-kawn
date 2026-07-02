import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../core/config";
import { RENDER_CONFIG } from "../render/RenderConfig";

/**
 * Starfield — procedural deep-space background with three layered passes.
 *
 *  1. Main star points — uniform sphere-shell distribution with
 *     temperature-classified colors (O/B blue, G/K white, M red).
 *  2. Milky-way band — a denser, dust-tinted belt biased toward the
 *     galactic plane, with a faint warm haze on a back-side sphere.
 *  3. Interstellar dust — very faint additive points around the band
 *     to give the sky a sense of depth rather than a hard sphere.
 *
 * Densities and band brightness come from RENDER_CONFIG so future
 * quality presets can downscale uniformly.
 */
export function Starfield() {
  const starsRef = useRef<THREE.Points>(null);
  const mwRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const hazeRef = useRef<THREE.ShaderMaterial>(null);

  const main = useMemo(() => {
    const { count, radius, depth } = ENGINE_CONFIG.starfield;
    const n = Math.round(count * RENDER_CONFIG.starfield.densityFactor);
    return generatePoints(n, radius, depth, /* bandBias */ 0);
  }, []);

  const milkyWay = useMemo(() => {
    const { radius, depth } = ENGINE_CONFIG.starfield;
    const n = Math.round(4500 * RENDER_CONFIG.starfield.densityFactor);
    return generatePoints(n, radius * 0.95, depth * 0.7, /* bandBias */ 0.92, "warm");
  }, []);

  const dust = useMemo(() => {
    const { radius, depth } = ENGINE_CONFIG.starfield;
    const n = Math.round(900 * RENDER_CONFIG.starfield.densityFactor);
    return generatePoints(n, radius * 0.9, depth * 0.5, /* bandBias */ 0.97, "dust");
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    [starsRef, mwRef, dustRef].forEach((r) => {
      if (r.current) r.current.rotation.y += delta * 0.002;
    });
    if (matRef.current) {
      matRef.current.opacity =
        0.92 + Math.sin(t * 0.7) * 0.03 + Math.sin(t * 1.9) * 0.02;
    }
    if (hazeRef.current) hazeRef.current.uniforms.uTime.value = t;
  });

  const baseSize = ENGINE_CONFIG.starfield.baseSize;

  return (
    <group>
      {/* Soft milky-way haze on a back-side sphere */}
      <MilkyWayHaze
        radius={ENGINE_CONFIG.starfield.radius * 1.04}
        intensity={RENDER_CONFIG.starfield.milkyWayIntensity}
        hazeRef={hazeRef}
      />

      {/* Main star catalog */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[main.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[main.colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[main.sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          vertexColors
          size={baseSize}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Milky-way band stars */}
      <points ref={mwRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[milkyWay.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[milkyWay.colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[milkyWay.sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={baseSize * 0.85}
          sizeAttenuation
          transparent
          opacity={0.85 * RENDER_CONFIG.starfield.milkyWayIntensity + 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Interstellar dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dust.colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[dust.sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={baseSize * 4}
          sizeAttenuation
          transparent
          opacity={RENDER_CONFIG.starfield.dustIntensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Soft galactic-plane haze rendered as a back-side sphere shader. Provides
 * a very low-frequency brightness gradient that the bright Milky-Way band
 * stars sit on top of.
 */
function MilkyWayHaze({
  radius,
  intensity,
  hazeRef,
}: {
  radius: number;
  intensity: number;
  hazeRef: React.MutableRefObject<THREE.ShaderMaterial | null>;
}) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    }),
    [intensity],
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={hazeRef}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        vertexShader={/* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vDir;
          uniform float uTime;
          uniform float uIntensity;
          // Cheap value noise.
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1,0.2,0.3));
            p *= 17.0;
            return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
          }
          float noise(vec3 p){
            vec3 i=floor(p); vec3 f=fract(p);
            f=f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                           mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                           mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
          }
          void main() {
            // Galactic plane along Y ~ 0 (rotated to feel oblique).
            vec3 d = normalize(vDir);
            float plane = 1.0 - abs(d.y * 1.4 + d.x * 0.25);
            // Tighter band, softer falloff — the Milky-Way is a hint,
            // never a wash of colour across the whole sky.
            plane = smoothstep(0.72, 1.0, plane);
            float clouds = noise(d * 5.0) * 0.6 + noise(d * 13.0) * 0.4;
            float v = plane * (0.25 + 0.55 * clouds) * uIntensity;
            // Cool interstellar tint: deep indigo shading to a soft
            // dust-white in the densest lanes. No warm brown ever.
            vec3 col = mix(vec3(0.05, 0.06, 0.11), vec3(0.28, 0.30, 0.42), clouds);
            gl_FragColor = vec4(col * v, v);
          }
        `}
      />
    </mesh>
  );
}

interface PointSet {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

/**
 * Generate a star catalog. `bandBias` (0..1) biases declination toward the
 * y=0 plane so milky-way / dust passes cluster there.
 */
function generatePoints(
  count: number,
  radius: number,
  depth: number,
  bandBias = 0,
  flavor: "stars" | "warm" | "dust" = "stars",
): PointSet {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;

    // Pull phi toward equator when bandBias > 0.
    let cosPhi = 2 * v - 1;
    if (bandBias > 0) cosPhi *= 1 - bandBias;
    const phi = Math.acos(THREE.MathUtils.clamp(cosPhi, -1, 1));
    const r = radius + (Math.random() - 0.5) * depth;

    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    if (flavor === "dust") {
      tmp.setHSL(0.08 + Math.random() * 0.03, 0.4, 0.25 + Math.random() * 0.15);
      sizes[i] = Math.pow(Math.random(), 2) * 4 + 1.5;
    } else if (flavor === "warm") {
      // Milky-way: mostly warm K/G with rare blue O/B.
      const t = Math.random();
      if (t < 0.65) tmp.setHSL(0.09, 0.35, 0.7 + Math.random() * 0.2);
      else if (t < 0.92) tmp.setHSL(0.6, 0.08, 0.85 + Math.random() * 0.15);
      else tmp.setHSL(0.58, 0.5, 0.75 + Math.random() * 0.2);
      sizes[i] = Math.pow(Math.random(), 5) * 2.4 + 0.4;
    } else {
      // Color-temperature spectrum: cool white majority, warm + blue accents.
      const t = Math.random();
      if (t < 0.55) tmp.setHSL(0.6, 0.04, 0.85 + Math.random() * 0.15);
      else if (t < 0.78) tmp.setHSL(0.6, 0.35, 0.7 + Math.random() * 0.2);
      else if (t < 0.92) tmp.setHSL(0.08, 0.5, 0.7 + Math.random() * 0.2);
      else tmp.setHSL(0.02, 0.6, 0.6 + Math.random() * 0.2);
      sizes[i] = Math.pow(Math.random(), 6) * 3 + 0.4;
    }

    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  return { positions, colors, sizes };
}
