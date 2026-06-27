import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * EmissiveStarMaterial — procedural value-noise surface for any star.
 * Identical visual signature to the original hand-rolled Sun shader; extracted
 * so Sirius, Proxima, Rigel, etc. can reuse it through tint uniforms.
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

  void main() {
    vec3 p = vPos * 0.25 + vec3(0.0, uTime * 0.04, 0.0);
    float n = noise(p) * 0.6 + noise(p * 2.3) * 0.3 + noise(p * 5.1) * 0.1;
    vec3 col = mix(uCold, uHot, smoothstep(0.35, 0.85, n));
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 1.5);
    col += uRim * rim * 0.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  coldColor?: string;
  hotColor?: string;
  rimColor?: string;
}

export function EmissiveStarMaterial({
  coldColor = "#ff8c26",
  hotColor = "#fff2bf",
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
