import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RENDER_CONFIG } from "./RenderConfig";

/**
 * SolarCorona — additive shell + camera-facing glare disc.
 *
 * The shell uses an inverse-fresnel falloff so the brightness peaks at the
 * limb of the star and fades into space, mimicking the visible corona seen
 * during eclipses. The glare sprite is a soft radial gradient that gives
 * the bloom pass a generous halo to bleed.
 *
 * Both layers are additive and depth-write-off so they never occlude
 * geometry behind them.
 */
const coronaVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const coronaFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3 uColor;
  uniform float uTime;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fres = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.2);
    // Subtle solar activity pulse: low-frequency breathing.
    float activity = 0.92 + 0.08 * sin(uTime * 0.35);
    float a = fres * activity;
    gl_FragColor = vec4(uColor * a * 1.6, a);
  }
`;

const glareFrag = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float a = pow(1.0 - clamp(d, 0.0, 1.0), 3.5);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

const glareVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface Props {
  radius: number;
  color?: string;
  /** Multiplier on glare opacity and corona scale (luminosity-driven). */
  intensityScale?: number;
}

export function SolarCorona({ radius, color, intensityScale = 1 }: Props) {
  const shellRef = useRef<THREE.ShaderMaterial>(null);
  const glareRef = useRef<THREE.Mesh>(null);
  const cfg = RENDER_CONFIG.star;
  const scale = Math.max(0.3, intensityScale);

  const shellUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color ?? cfg.coronaColor) },
    }),
    [color, cfg.coronaColor],
  );

  const glareUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color ?? cfg.coronaColor) },
      uOpacity: { value: cfg.glareOpacity * scale },
    }),
    [color, cfg.coronaColor, cfg.glareOpacity, scale],
  );

  useFrame((state) => {
    shellUniforms.uTime.value = state.clock.elapsedTime;
    // Glare disc always faces the camera.
    if (glareRef.current) glareRef.current.quaternion.copy(state.camera.quaternion);
  });

  return (
    <group>
      {/* Soft corona shell */}
      <mesh scale={cfg.coronaScale * (0.7 + 0.6 * Math.min(1.6, scale))}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          ref={shellRef}
          uniforms={shellUniforms}
          vertexShader={coronaVert}
          fragmentShader={coronaFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      {/* Billboard glare to feed bloom */}
      <mesh ref={glareRef} renderOrder={3}>
        <planeGeometry args={[radius * cfg.glareScale, radius * cfg.glareScale]} />
        <shaderMaterial
          uniforms={glareUniforms}
          vertexShader={glareVert}
          fragmentShader={glareFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
