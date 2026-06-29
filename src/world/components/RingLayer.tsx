import { useMemo } from "react";
import * as THREE from "three";
import type { RingsDef } from "../types/CelestialBody";
import { RENDER_CONFIG } from "../../render/RenderConfig";

/**
 * RingLayer — procedural banded ring system with planet self-shadow.
 *
 *  - Radial bands with three layered frequencies and a couple of darker
 *    gaps (Cassini-like) keep the ring from reading as a single stripe.
 *  - A planet-shadow term darkens the side of the ring opposite the Sun,
 *    using a world-space test against a unit cylinder around the planet.
 *  - Light-side response increases reflectance when the Sun is grazing
 *    the ring plane, matching real photometry.
 *
 * Inner / outer radius come from data; tilt is applied by the parent
 * planet group, so the same shader works for Saturn, Uranus, etc.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  void main() {
    vUv = uv;
    vLocalPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec3 uPlanetPos;
  uniform float uPlanetRadius;
  uniform vec3 uSunPos;
  uniform float uShadowStrength;

  void main() {
    // vUv.x runs 0..1 across radius for ringGeometry.
    float r = vUv.x;

    // Soft fade on inner & outer edges.
    float edge = smoothstep(0.0, 0.07, r) * (1.0 - smoothstep(0.93, 1.0, r));

    // Three octaves of bands so nothing looks striped.
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

    // Planet self-shadow: project (worldPos - planetPos) onto the sun ray.
    // If the projection is positive (behind planet w.r.t. Sun) and the
    // perpendicular distance is within the planet radius, we're in shadow.
    vec3 sunDir = normalize(uSunPos - uPlanetPos);
    vec3 toPoint = vWorldPos - uPlanetPos;
    float along = dot(toPoint, sunDir);
    vec3 perp = toPoint - sunDir * along;
    float perpLen = length(perp);
    float shadow = 0.0;
    if (along < 0.0) {
      // Distance to cylinder surface (negative = inside).
      float s = smoothstep(uPlanetRadius * 1.05, uPlanetRadius * 0.85, perpLen);
      shadow = s * uShadowStrength;
    }

    // Light-side response: stronger when sun grazes the ring plane.
    // Ring normal is local +Y of the planet group (we don't have it here,
    // approximate via world up of the ring face).
    float graze = 1.0 - abs(normalize(sunDir).y);
    float lit = mix(0.55, 1.0, graze);

    float a = uOpacity * edge * dust * (0.35 + 0.65 * bands);
    a *= (1.0 - shadow);
    vec3 col = uColor * (0.65 + 0.35 * bands) * lit;
    gl_FragColor = vec4(col, a);
  }
`;

interface Props {
  rings: RingsDef;
  planetPosition?: THREE.Vector3;
  planetRadius?: number;
  sunPosition?: THREE.Vector3;
}

export function RingLayer({
  rings,
  planetPosition,
  planetRadius = 1,
  sunPosition,
}: Props) {
  const cfg = RENDER_CONFIG.rings;
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(rings.color ?? "#d9c7a3") },
      uOpacity: { value: rings.opacity ?? 0.9 },
      uPlanetPos: { value: (planetPosition ?? new THREE.Vector3()).clone() },
      uPlanetRadius: { value: planetRadius },
      uSunPos: { value: (sunPosition ?? new THREE.Vector3()).clone() },
      uShadowStrength: { value: cfg.shadowStrength },
    }),
    [
      rings.color,
      rings.opacity,
      planetPosition,
      planetRadius,
      sunPosition,
      cfg.shadowStrength,
    ],
  );

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
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
