import { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { StageState } from "../state/stage";
import { InputManager } from "../../observer/input/InputManager";
import { RealSky } from "./RealSky";




/**
 * SurfaceScene — Phase 23 opening composition.
 *
 * The Observer stands on Earth at night, looking up at the sky. The
 * curved horizon of the planet sits at the bottom ~15–20 % of the frame,
 * lit by:
 *   - a bright, thin atmospheric limb (blue → cyan → warm) at grazing
 *     angle, fading upward into deep space;
 *   - a scatter of city lights on the near hemisphere, faint and warm,
 *     giving the ground a lived-in quality without dominating;
 *   - the shared Starfield above (Milky-Way band + stars) rendered by
 *     WorldScene, unmodified so the sky is continuous with cosmos.
 *
 * No planets, no Sun, no deep-sky objects are added here.
 */

// Earth radius in scene units. Kept well below the shared Starfield
// sphere (radius ~900) so the observer stands beneath a full sky of
// stars instead of being trapped inside the star shell. The horizon
// still curves gently at this scale.
const EARTH_RADIUS = 380;
const OBSERVER_HEIGHT = 0.12;

export function SurfaceScene() {
  const { camera, gl } = useThree();
  const yawRef = useRef(0);
  // Small upward tilt: horizon curves at the bottom of the frame,
  // the sky occupies ~80 % of the image.
  const pitchRef = useRef(0.45);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const prev = {
      pos: camera.position.clone(),
      quat: camera.quaternion.clone(),
      fov: (camera as THREE.PerspectiveCamera).fov,
    };
    camera.position.set(0, EARTH_RADIUS + OBSERVER_HEIGHT, 0);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = 60;
    persp.near = 0.01;
    persp.far = 20_000;
    persp.updateProjectionMatrix();
    return () => {
      camera.position.copy(prev.pos);
      camera.quaternion.copy(prev.quat);
      persp.fov = prev.fov;
      persp.updateProjectionMatrix();
    };
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (ev: PointerEvent) => {
      draggingRef.current = true;
      lastRef.current = { x: ev.clientX, y: ev.clientY };
      el.setPointerCapture(ev.pointerId);
    };
    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - lastRef.current.x;
      const dy = ev.clientY - lastRef.current.y;
      lastRef.current = { x: ev.clientX, y: ev.clientY };
      const sens = 0.003;
      yawRef.current -= dx * sens;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - dy * sens,
        -0.15,
        Math.PI / 2 - 0.05,
      );
    };
    const onUp = (ev: PointerEvent) => {
      draggingRef.current = false;
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }
    };
    const onWheel = (ev: WheelEvent) => {
      if (ev.deltaY > 0) StageState.set("cosmos");
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  const upWorld = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(() => {
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const fwd = new THREE.Vector3(
      Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch),
      Math.cos(pitch) * Math.cos(yaw),
    );
    const lookAt = camera.position.clone().add(fwd);
    camera.up.copy(upWorld);
    camera.lookAt(lookAt);
    // Décollage naturel : toute translation depuis la Terre nous fait
    // basculer immédiatement dans le cosmos, sans chargement ni bouton.
    const s = InputManager.state;
    if (s.forward !== 0 || s.strafe !== 0) {
      StageState.set("cosmos");
    }
  });


  return (
    <group>
      {/* Earth ground — near-black matte sphere. Only the atmospheric
          limb separates it from the sky. */}
      <mesh renderOrder={-3}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshBasicMaterial color="#010104" toneMapped={false} />
      </mesh>

      {/* City lights scattered across the near hemisphere. */}
      <CityLights radius={EARTH_RADIUS * 1.0005} />

      {/* Thin, bright atmospheric limb — blue base, cyan mid, warm
          orange kiss right at the horizon; fades up into deep space. */}
      <AtmosphereRim radius={EARTH_RADIUS * 1.012} />
    </group>
  );
}

/**
 * CityLights — a dense scatter of tiny warm points across the visible
 * hemisphere (observer at the pole). Additive, size-attenuated so
 * distant lights pack tightly along the horizon.
 */
function CityLights({ radius }: { radius: number }) {
  const geom = useMemo(() => {
    const count = 4200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Bias toward the horizon (latitude further from the pole) so
      // lights read as distant cities smeared along the curve, not as
      // a dot right under the camera.
      const rand = Math.random();
      const t = Math.pow(rand, 0.35); // 0 = pole, 1 = equator
      const phi = t * (Math.PI / 2 - 0.02); // angle from pole
      const theta = Math.random() * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      positions[i * 3 + 0] = radius * sinP * Math.cos(theta);
      positions[i * 3 + 1] = radius * cosP;
      positions[i * 3 + 2] = radius * sinP * Math.sin(theta);

      // Warm sodium-vapour palette with occasional cool white LEDs.
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

  return (
    <points geometry={geom} renderOrder={-2}>
      <pointsMaterial
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
 * AtmosphereRim — thin bright limb above the horizon. Grazing angle
 * (Fresnel) drives a three-stop gradient: warm at the deepest limb,
 * cyan in the middle, cold blue as it rises. Rendered on a back-side
 * sphere so the shader shades the near side of the shell.
 */
function AtmosphereRim({ radius }: { radius: number }) {
  const uniforms = useMemo(
    () => ({
      uColorLow: { value: new THREE.Color("#ff8a3d") },
      uColorMid: { value: new THREE.Color("#3fa8ff") },
      uColorHigh: { value: new THREE.Color("#0b2a6a") },
      uIntensity: { value: 1.35 },
    }),
    [],
  );
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
          void main() {
            float ndv = abs(dot(normalize(vNormal), normalize(vView)));
            // Grazing intensity: bright thin band at the limb.
            float rim = pow(1.0 - ndv, 6.0);
            // Three-stop gradient across the band thickness.
            float low  = pow(1.0 - ndv, 22.0);        // hot kiss at horizon
            float mid  = pow(1.0 - ndv, 8.0) - low;   // cyan body
            float high = rim - low - mid;             // cold blue rise
            mid = max(mid, 0.0);
            high = max(high, 0.0);
            vec3 col = uColorLow * low * 1.4
                     + uColorMid * mid * 1.0
                     + uColorHigh * high * 0.6;
            float alpha = rim;
            gl_FragColor = vec4(col * uIntensity, alpha);
          }
        `}
      />
    </mesh>
  );
}
