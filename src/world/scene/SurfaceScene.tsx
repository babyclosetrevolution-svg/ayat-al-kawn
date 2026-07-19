import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../../core/config";
import { RealSky } from "./RealSky";

/**
 * SurfaceScene — the home Earth, always mounted.
 *
 * Positioned at ENGINE_CONFIG.homeEarth.position, this layer renders the
 * ground (Earth sphere), a scatter of city lights, the atmospheric limb
 * and the real-sky shell (Sun, Moon, planets, named stars) as children
 * of a single group. Because the group lives at a fixed world position,
 * the Observer glides toward or away from it like any real celestial
 * body — no scene swap, no camera hand-off, no "leaving Earth" moment.
 *
 * Atmosphere and city lights fade smoothly with altitude so the
 * transition from surface to space feels continuous instead of gated.
 * Everything else (star shell, ground) stays present so the scene
 * remains a single reference frame.
 */

const HOME = new THREE.Vector3(...ENGINE_CONFIG.homeEarth.position);
const EARTH_RADIUS = ENGINE_CONFIG.homeEarth.radius;

export function SurfaceScene() {
  return (
    <group position={HOME}>
      {/* Ground — near-black matte sphere. */}
      <mesh renderOrder={-3}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshBasicMaterial color="#010104" toneMapped={false} />
      </mesh>

      {/* City lights scattered across the hemisphere. */}
      <CityLights radius={EARTH_RADIUS * 1.0005} />

      {/* Thin, bright atmospheric limb — fades with altitude. */}
      <AtmosphereRim radius={EARTH_RADIUS * 1.012} />

      {/* Real astronomical sky — rides with the home Earth so the
          celestial dome always surrounds the Observer while grounded. */}
      <RealSky />
    </group>
  );
}

/**
 * CityLights — a dense scatter of tiny warm points across the visible
 * hemisphere (observer at the pole). Additive; fades out as the
 * Observer climbs above the atmosphere.
 */
function CityLights({ radius }: { radius: number }) {
  const matRef = useRef<THREE.PointsMaterial>(null);
  const { camera } = useThree();
  const worldPos = useRef(new THREE.Vector3()).current;
  const groupPos = useRef(new THREE.Vector3()).current;

  const geom = useMemo(() => {
    const count = 4200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      const t = Math.pow(rand, 0.35);
      const phi = t * (Math.PI / 2 - 0.02);
      const theta = Math.random() * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      positions[i * 3 + 0] = radius * sinP * Math.cos(theta);
      positions[i * 3 + 1] = radius * cosP;
      positions[i * 3 + 2] = radius * sinP * Math.sin(theta);
      const cool = Math.random() < 0.12;
      if (cool) tmp.setHSL(0.58, 0.15, 0.75);
      else tmp.setHSL(0.09 + Math.random() * 0.03, 0.75, 0.55 + Math.random() * 0.2);
      colors[i * 3 + 0] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
      sizes[i] = 0.6 + Math.pow(Math.random(), 3) * 2.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [radius]);

  useFrame(({ scene }) => {
    // Compute altitude above ground in world space.
    scene.getWorldPosition(groupPos);
    groupPos.copy(HOME);
    worldPos.copy(camera.position);
    const dist = worldPos.distanceTo(groupPos);
    const alt = Math.max(0, dist - EARTH_RADIUS);
    // Full at ground, gone after ~4× radius of climb.
    const t = Math.min(1, alt / (EARTH_RADIUS * 4));
    const fade = 1 - t;
    if (matRef.current) matRef.current.opacity = 0.9 * fade;
  });

  return (
    <points geometry={geom} renderOrder={-2}>
      <pointsMaterial
        ref={matRef}
        vertexColors
        size={2.2}
        sizeAttenuation={false}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/**
 * AtmosphereRim — thin bright limb above the horizon. Grazing-angle
 * three-stop gradient (warm → cyan → cold blue). Fades to zero as the
 * Observer climbs into space so leaving Earth is a natural transition,
 * not a gated cutover.
 */
function AtmosphereRim({ radius }: { radius: number }) {
  const { camera } = useThree();
  const worldPos = useRef(new THREE.Vector3()).current;
  const uniforms = useMemo(
    () => ({
      uColorLow: { value: new THREE.Color("#ff8a3d") },
      uColorMid: { value: new THREE.Color("#3fa8ff") },
      uColorHigh: { value: new THREE.Color("#0b2a6a") },
      uIntensity: { value: 1.35 },
      uFade: { value: 1 },
    }),
    [],
  );

  useFrame(() => {
    worldPos.copy(camera.position);
    const dist = worldPos.distanceTo(HOME);
    const alt = Math.max(0, dist - EARTH_RADIUS);
    // Atmosphere is dense at ground, thin by 2× radius, gone by 6×.
    const t = Math.min(1, alt / (EARTH_RADIUS * 6));
    uniforms.uFade.value = 1 - t * t * (3 - 2 * t);
  });

  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[radius, 128, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(mat3(modelMatrix) * normal);
            vView = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          uniform vec3 uColorLow;
          uniform vec3 uColorMid;
          uniform vec3 uColorHigh;
          uniform float uIntensity;
          uniform float uFade;
          void main() {
            float ndv = abs(dot(normalize(vNormal), normalize(vView)));
            float rim = pow(1.0 - ndv, 6.0);
            float low  = pow(1.0 - ndv, 22.0);
            float mid  = pow(1.0 - ndv, 8.0) - low;
            float high = rim - low - mid;
            mid = max(mid, 0.0);
            high = max(high, 0.0);
            vec3 col = uColorLow * low * 1.4
                     + uColorMid * mid * 1.0
                     + uColorHigh * high * 0.6;
            float alpha = rim * uFade;
            gl_FragColor = vec4(col * uIntensity * uFade, alpha);
          }
        `}
      />
    </mesh>
  );
}
