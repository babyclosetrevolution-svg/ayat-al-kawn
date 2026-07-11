import { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { StageState } from "../state/stage";

/**
 * SurfaceScene — Phase 22.6 opening layer.
 *
 * The Observer stands on the Earth at ~1.7 m. The camera looks toward the
 * horizon. No planets, no Sun, no deep-sky objects are rendered here.
 * The only visible things are:
 *   - the curved horizon (a large Earth-scaled ground sphere),
 *   - a thin atmospheric rim gradient at the horizon,
 *   - the shared procedural Starfield (rendered by WorldScene),
 * so the composition reads as "looking into infinity from home".
 *
 * The scene owns the camera while active: OrbitControls are disabled, and
 * a minimal look controller reads pointer deltas for yaw/pitch. Zooming
 * out past a threshold transitions to the cosmic stage.
 */

// Earth radius in scene units — arbitrary but large enough that the
// horizon curves gently rather than reading as a small sphere.
const EARTH_RADIUS = 6000;
const OBSERVER_HEIGHT = 1.7; // metres — the reference feel of "standing".

export function SurfaceScene() {
  const { camera, gl } = useThree();
  const yawRef = useRef(0);
  // Opening pitch tilts upward: the Observer looks toward the sky,
  // not the ground. The horizon curves at the bottom of the frame.
  const pitchRef = useRef(0.55);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  // Anchor the camera on the surface once, and restore its previous pose
  // when leaving the surface stage so the cosmos view is not disturbed.
  useEffect(() => {
    const prev = {
      pos: camera.position.clone(),
      quat: camera.quaternion.clone(),
      fov: (camera as THREE.PerspectiveCamera).fov,
    };
    camera.position.set(0, EARTH_RADIUS + OBSERVER_HEIGHT, 0);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = 65; // human-eye-ish for the opening
    persp.near = 0.05;
    persp.far = 2_000_000;
    persp.updateProjectionMatrix();
    return () => {
      camera.position.copy(prev.pos);
      camera.quaternion.copy(prev.quat);
      persp.fov = prev.fov;
      persp.updateProjectionMatrix();
    };
  }, [camera]);

  // Minimal look controller — drag to rotate, wheel-out to leave Earth.
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
      const sens = 0.0035;
      yawRef.current -= dx * sens;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - dy * sens,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05,
      );
    };
    const onUp = (ev: PointerEvent) => {
      draggingRef.current = false;
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* pointer may already be released */
      }
    };
    // Wheel-out (or pinch-out) → leave the Earth. Wheel-in is ignored
    // so the user cannot accidentally zoom "into the ground".
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
    // Local "up" at this point on the sphere is +Y (we placed the observer
    // at the north pole for simplicity — direction is arbitrary).
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
  });

  return (
    <group>
      {/* Earth ground — matte dark sphere. No lighting is required: the
          material stays intentionally near-black so only the silhouette
          of the horizon separates ground from sky. */}
      <mesh position={[0, 0, 0]} renderOrder={-2}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshBasicMaterial color="#020306" toneMapped={false} />
      </mesh>

      {/* Thin atmospheric rim — a slightly larger sphere rendered on the
          back-side with a soft blue fresnel band at the horizon. Feels
          like the edge of the atmosphere against deep space. */}
      <AtmosphereRim radius={EARTH_RADIUS * 1.008} />
    </group>
  );
}

function AtmosphereRim({ radius }: { radius: number }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#3a7bd6") },
      uIntensity: { value: 0.9 },
    }),
    [],
  );
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[radius, 96, 96]} />
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
          uniform vec3 uColor;
          uniform float uIntensity;
          void main() {
            float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
            rim = pow(rim, 5.5);
            gl_FragColor = vec4(uColor * rim * uIntensity, rim);
          }
        `}
      />
    </mesh>
  );
}
