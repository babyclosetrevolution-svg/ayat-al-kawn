import { useMemo } from "react";
import * as THREE from "three";
import type { AtmosphereDef } from "../types/CelestialBody";
import { RENDER_CONFIG } from "../../render/RenderConfig";

/**
 * AtmosphereLayer — additive Fresnel halo with day/night scattering bias.
 *
 *  - Rim brightens with view angle (Fresnel) to feel like sky thickness.
 *  - Day-side modulates with the sun direction so the atmosphere reads as
 *    a halo of scattered light, not a uniform shell.
 *  - Night side fades out softly so the planet doesn't have a fake glow
 *    on its dark hemisphere.
 *
 * Geometry segments and global intensity come from RENDER_CONFIG so a
 * future "low quality" preset can downgrade the layer in one place.
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
  uniform float uRimPower;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 sunDir = normalize(uSunPos - vWorldPos);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float fres = pow(1.0 - max(dot(N, viewDir), 0.0), uRimPower);

    // Soft day/night scattering: wider, gentler than dot(N, sunDir) alone.
    float sunFacing = max(dot(N, sunDir), 0.0);
    float scatter = smoothstep(-0.15, 0.85, dot(N, sunDir));

    // Night-side fades almost entirely; preserves a faint twilight halo at the limb.
    float nightFade = mix(0.05, 1.0, scatter);

    float intensity = fres * (0.25 + 0.75 * sunFacing) * nightFade * uIntensity;
    gl_FragColor = vec4(uColor * intensity, intensity);
  }
`;

interface Props {
  radius: number;
  atmosphere: AtmosphereDef;
  sunPosition: THREE.Vector3;
  /** Optional live multiplier from the Science Engine. */
  intensityMultiplier?: number;
  /** Hide the layer entirely (kept mounted to preserve material warmup). */
  visible?: boolean;
}

export function AtmosphereLayer({
  radius,
  atmosphere,
  sunPosition,
  intensityMultiplier = 1,
  visible = true,
}: Props) {
  const cfg = RENDER_CONFIG.atmosphere;
  const uniforms = useMemo(
    () => ({
      uSunPos: { value: sunPosition.clone() },
      uColor: { value: new THREE.Color(atmosphere.color) },
      uIntensity: {
        value: (atmosphere.intensity ?? 1) * cfg.intensity * intensityMultiplier,
      },
      uRimPower: { value: cfg.rimPower },
    }),
    [
      atmosphere.color,
      atmosphere.intensity,
      sunPosition,
      cfg.intensity,
      cfg.rimPower,
      intensityMultiplier,
    ],
  );

  return (
    <mesh scale={atmosphere.scale ?? 1.08} visible={visible}>
      <sphereGeometry args={[radius, cfg.segments, cfg.segments]} />
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

