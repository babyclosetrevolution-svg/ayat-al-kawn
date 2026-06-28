import { useMemo } from "react";
import * as THREE from "three";
import type { RingsDef } from "../types/CelestialBody";

/**
 * RingLayer — procedural banded ring system for Saturn / Uranus / etc.
 *
 * A radial shader gives gentle alternating bands without a texture asset,
 * keeping the renderer fully data-driven. Inner/outer radius come from
 * the body data; tilt is applied by the parent planet group.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uInner;
  uniform float uOuter;

  // Cheap hash for band variation.
  float hash(float x){ return fract(sin(x * 91.345) * 43758.5453); }

  void main() {
    // vUv.x runs 0..1 across radius for ringGeometry.
    float r = vUv.x;
    // Soft fade on inner & outer edges.
    float edge = smoothstep(0.0, 0.08, r) * (1.0 - smoothstep(0.92, 1.0, r));

    // Concentric bands: combine three frequencies so it never looks striped.
    float bands =
        0.55 + 0.45 * sin(r * 180.0)
      + 0.20 * sin(r * 47.0 + 1.7)
      + 0.10 * sin(r * 11.0);
    bands = clamp(bands * 0.55, 0.0, 1.0);

    // A handful of darker gaps at quasi-random positions.
    float gap = smoothstep(0.002, 0.0, abs(r - 0.32))
              + smoothstep(0.002, 0.0, abs(r - 0.58))
              + smoothstep(0.002, 0.0, abs(r - 0.74));
    float dust = 1.0 - clamp(gap * 0.9, 0.0, 0.9);

    float a = uOpacity * edge * dust * (0.4 + 0.6 * bands);
    vec3 col = uColor * (0.7 + 0.3 * bands);
    gl_FragColor = vec4(col, a);
  }
`;

export function RingLayer({ rings }: { rings: RingsDef }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(rings.color ?? "#d9c7a3") },
      uOpacity: { value: rings.opacity ?? 0.9 },
      uInner: { value: rings.innerRadius },
      uOuter: { value: rings.outerRadius },
    }),
    [rings.color, rings.opacity, rings.innerRadius, rings.outerRadius],
  );

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
      <ringGeometry args={[rings.innerRadius, rings.outerRadius, 192, 4]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
