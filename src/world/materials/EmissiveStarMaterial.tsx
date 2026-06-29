import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * EmissiveStarMaterial — procedural plasma surface for any star.
 *
 * Multi-octave value noise drives a hot/cold temperature mix, with a
 * slow-flowing "convection" term and a subtle granulation pattern so the
 * surface reads as a turbulent photosphere rather than a static texture.
 * Tint colors are uniform so Sirius, Proxima, Betelgeuse can all reuse it.
 */
const vert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float uTime;
  uniform vec3 uCold;
  uniform vec3 uHot;
  uniform vec3 uRim;

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
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.55;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.55;
    }
    return v;
  }

  void main() {
    // Slow vertical drift — convection-like.
    vec3 p = vPos * 0.22 + vec3(0.0, uTime * 0.025, 0.0);
    float base = fbm(p);
    // Fine granulation overlay.
    float gran = noise(vPos * 4.0 + vec3(uTime * 0.05));
    float n = base * 0.85 + gran * 0.15;

    vec3 col = mix(uCold, uHot, smoothstep(0.32, 0.88, n));
    // Bright hot spots — flare-like overshoot.
    col += uHot * smoothstep(0.78, 0.95, n) * 0.5;

    // Limb-darkening compensated rim brightening for visible "glow".
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 1.4);
    col += uRim * rim * 0.45;

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  coldColor?: string;
  hotColor?: string;
  rimColor?: string;
}

export function EmissiveStarMaterial({
  coldColor = "#ff8a26",
  hotColor = "#fff4c8",
  rimColor = "#ffb259",
}: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCold: { value: new THREE.Color(coldColor) },
      uHot: { value: new THREE.Color(hotColor) },
      uRim: { value: new THREE.Color(rimColor) },
    }),
    [coldColor, hotColor, rimColor],
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });

  return (
    <shaderMaterial
      ref={matRef}
      uniforms={uniforms}
      vertexShader={vert}
      fragmentShader={frag}
      toneMapped={false}
    />
  );
}
