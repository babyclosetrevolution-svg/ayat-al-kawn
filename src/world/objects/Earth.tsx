import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { FocusRegistry } from "../state/focus";
import { SUN_POSITION } from "./Sun";

/**
 * Earth — cinematic centerpiece.
 *  - PBR-ish surface from day/normal/specular maps
 *  - Independent rotating cloud layer
 *  - Soft atmospheric Fresnel glow
 *  - Receives shadowing implicitly via Lambert/Phong response to the Sun's PointLight
 */
const EARTH_RADIUS = 2;
const EARTH_POSITION = new THREE.Vector3(0, 0, 0);

const TEX = {
  day: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg",
  normal: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_normal_2048.jpg",
  spec: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_specular_2048.jpg",
  clouds: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_clouds_1024.png",
};

const atmosphereVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const atmosphereFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform vec3 uSunDir;
  uniform vec3 uColor;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fres = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    float sunFacing = max(dot(normalize(vNormal), uSunDir), 0.0);
    float intensity = fres * (0.4 + 0.6 * sunFacing);
    gl_FragColor = vec4(uColor * intensity, intensity);
  }
`;

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specMap, cloudMap] = useLoader(THREE.TextureLoader, [
    TEX.day,
    TEX.normal,
    TEX.spec,
    TEX.clouds,
  ]);

  useMemo(() => {
    [dayMap, normalMap, specMap, cloudMap].forEach((t) => {
      t.anisotropy = 8;
    });
    dayMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.colorSpace = THREE.SRGBColorSpace;
  }, [dayMap, normalMap, specMap, cloudMap]);

  const atmoUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_POSITION.clone().sub(EARTH_POSITION).normalize() },
      uColor: { value: new THREE.Color(0x5aa9ff) },
    }),
    [],
  );

  useMemo(() => {
    FocusRegistry.register("earth", {
      position: EARTH_POSITION.clone(),
      distance: EARTH_RADIUS * 4,
    });
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.04;
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group position={EARTH_POSITION}>
      <mesh ref={earthRef} castShadow receiveShadow userData={{ focusKey: "earth" }}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specMap}
          specular={new THREE.Color(0x333a48)}
          shininess={18}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudRef} scale={1.015}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
      {/* Atmosphere */}
      <mesh scale={1.08}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          uniforms={atmoUniforms}
          vertexShader={atmosphereVert}
          fragmentShader={atmosphereFrag}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

export { EARTH_POSITION, EARTH_RADIUS };
