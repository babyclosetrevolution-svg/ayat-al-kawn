import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PresenceEngine } from "../presence/PresenceEngine";
import { MotionSettingsStore } from "../flight/MotionSettings";

/**
 * MotionField — procedural "sense of motion" particles.
 *
 * A sparse cloud of faint points sits in a spherical shell that follows
 * the camera. When the Observer is moving fast enough (PresenceEngine
 * motion > 0), the material fades in and points stretch slightly along
 * the camera-forward axis, giving the peripheral sensation of travel.
 *
 * At rest, the material opacity is exactly zero — invisible on the
 * landing page, invisible during contemplation. No arcade effect.
 */
const COUNT = 240;
const SHELL_RADIUS = 40;

export function MotionField() {
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const smoothedIntensityRef = useRef(0);

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Uniform sphere-shell distribution around origin (group is
      // parented to the camera position each frame).
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = SHELL_RADIUS * (0.35 + Math.random() * 0.65);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    if (dt <= 0) return;
    const group = groupRef.current;
    const mat = matRef.current;
    const points = pointsRef.current;
    if (!group || !mat || !points) return;

    // Follow the camera position (particles are relative to the observer).
    group.position.copy(camera.position);

    const reduced = MotionSettingsStore.get().reduceMotion;
    const motion = reduced ? 0 : PresenceEngine.get().motion;
    const k = 1 - Math.exp(-2.4 * dt);
    smoothedIntensityRef.current += (motion - smoothedIntensityRef.current) * k;
    const m = smoothedIntensityRef.current;

    // Fully invisible at rest. Peak opacity kept whisper-low so it never
    // reads as "particles" — only as a peripheral sensation of flow.
    mat.opacity = m * 0.35;
    // Grow points slightly with intensity so faster travel feels denser
    // without changing world speed at all.
    mat.size = 0.5 + m * 1.1;
    // Recycle points that fall behind the camera: rotate the shell to
    // face along the current velocity direction so the illusion of flow
    // aligns with actual motion.
    if (m > 0.02) {
      group.quaternion.copy(camera.quaternion);
      // Cheap drift on the shell so it doesn't feel locked to the
      // camera rotation.
      group.rotation.z += dt * 0.06 * m;
    }
  }, 3);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          ref={matRef}
          color={new THREE.Color(0.75, 0.82, 1.0)}
          size={0.6}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
