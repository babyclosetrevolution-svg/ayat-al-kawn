import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RingsDef } from "../types/CelestialBody";
import { RENDER_CONFIG } from "../../render/RenderConfig";

/**
 * RingLayer — procedural banded ring system with planet self-shadow.
 *
 *  - Radial bands with three layered frequencies and Cassini-like gaps
 *    keep the ring from reading as a single stripe.
 *  - A planet shadow term darkens the ring on the side opposite the Sun,
 *    computed in the ring's local frame so the math is parent-agnostic.
 *  - Lit response increases when the Sun is grazing the ring plane.
 *
 * Inner / outer radius come from data; tilt is applied by the parent
 * planet group, so the same shader works for Saturn, Uranus, etc.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocalPos;
  void main() {
    vUv = uv;
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocalPos;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPlanetRadius;
  uniform vec3 uSunDirLocal;
  uniform float uShadowStrength;

  void main() {
    float r = vUv.x;

    // Soft fade on inner & outer edges.
    float edge = smoothstep(0.0, 0.07, r) * (1.0 - smoothstep(0.93, 1.0, r));

    // Three octaves of bands.
    float bands =
        0.55 + 0.45 * sin(r * 180.0)
      + 0.20 * sin(r * 47.0 + 1.7)
      + 0.10 * sin(r * 11.0);
    bands = clamp(bands * 0.55, 0.0, 1.0);

    // Cassini-style darker gaps.
    float gap = smoothstep(0.003, 0.0, abs(r - 0.32))
              + smoothstep(0.003, 0.0, abs(r - 0.58))
              + smoothstep(0.003, 0.0, abs(r - 0.74));
    float dust = 1.0 - clamp(gap * 0.9, 0.0, 0.9);

    // Planet self-shadow: cylinder along sun-direction in local frame.
    float along = dot(vLocalPos, uSunDirLocal);
    vec3 perp = vLocalPos - uSunDirLocal * along;
    float perpLen = length(perp);
    float shadow = 0.0;
    if (along < 0.0) {
      float s = smoothstep(uPlanetRadius * 1.05, uPlanetRadius * 0.85, perpLen);
      shadow = s * uShadowStrength;
    }

    // Grazing-angle brightness: ring plane normal is local +Z (ringGeometry
    // is on XY before parent rotation). Sun grazing => |dot(N, sun)| small.
    float graze = 1.0 - abs(uSunDirLocal.z);
    float lit = mix(0.55, 1.0, graze);

    float a = uOpacity * edge * dust * (0.35 + 0.65 * bands);
    a *= (1.0 - shadow);
    vec3 col = uColor * (0.65 + 0.35 * bands) * lit;
    gl_FragColor = vec4(col, a);
  }
`;

interface Props {
  rings: RingsDef;
  planetRadius?: number;
  sunPosition?: THREE.Vector3;
}

export function RingLayer({
  rings,
  planetRadius = 1,
  sunPosition,
}: Props) {
  const cfg = RENDER_CONFIG.rings;
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(rings.color ?? "#d9c7a3") },
      uOpacity: { value: rings.opacity ?? 0.9 },
      uPlanetRadius: { value: planetRadius },
      uSunDirLocal: { value: new THREE.Vector3(1, 0, 0) },
      uShadowStrength: { value: cfg.shadowStrength },
    }),
    [rings.color, rings.opacity, planetRadius, cfg.shadowStrength],
  );

  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
  const tmpM = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    const m = meshRef.current;
    if (!m || !sunPosition) return;
    // Get sun direction in the ring's local space.
    m.getWorldPosition(tmpA);
    tmpB.copy(sunPosition).sub(tmpA).normalize();
    tmpM.copy(m.matrixWorld).invert();
    // Transform as a direction (no translation).
    const e = tmpM.elements;
    const x = tmpB.x, y = tmpB.y, z = tmpB.z;
    uniforms.uSunDirLocal.value.set(
      e[0] * x + e[4] * y + e[8] * z,
      e[1] * x + e[5] * y + e[9] * z,
      e[2] * x + e[6] * y + e[10] * z,
    ).normalize();
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
      <ringGeometry args={[rings.innerRadius, rings.outerRadius, cfg.radialSegments, 4]} />
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
