import { useMemo } from "react";
import * as THREE from "three";
import type { AtmosphereDef } from "../types/CelestialBody";

/**
 * AtmosphereLayer — additive Fresnel halo around a body, day-side biased
 * toward the parent star. Sun-facing term is computed from a world-space
 * sun position uniform, so the layer is reusable for any planet.
 */
const vert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3 uSunPos;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    vec3 sunDir = normalize(uSunPos - vWorldPos);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fres = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    float sunFacing = max(dot(normalize(vNormal), sunDir), 0.0);
    float intensity = fres * (0.4 + 0.6 * sunFacing) * uIntensity;
    gl_FragColor = vec4(uColor * intensity, intensity);
  }
`;

interface Props {
  radius: number;
  atmosphere: AtmosphereDef;
  sunPosition: THREE.Vector3;
}

export function AtmosphereLayer({ radius, atmosphere, sunPosition }: Props) {
  const uniforms = useMemo(
    () => ({
      uSunPos: { value: sunPosition.clone() },
      uColor: { value: new THREE.Color(atmosphere.color) },
      uIntensity: { value: atmosphere.intensity ?? 1 },
    }),
    [atmosphere.color, atmosphere.intensity, sunPosition],
  );

  return (
    <mesh scale={atmosphere.scale ?? 1.08}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
