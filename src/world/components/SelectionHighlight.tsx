import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FocusRegistry } from "../state/focus";

/**
 * SelectionHighlight — soft equatorial halo that fades in around the active
 * body and gently pulses. Reads only from the FocusRegistry, so any object
 * registered there gets the same treatment without rendering coupling.
 */
export function SelectionHighlight() {
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const activeId = useRef<string | null>(FocusRegistry.getActive());
  const visualScale = useRef(0);

  useMemo(
    () => FocusRegistry.subscribe((k) => (activeId.current = k)),
    [],
  );

  useFrame((state, delta) => {
    const ring = ringRef.current;
    const mat = matRef.current;
    if (!ring || !mat) return;
    const id = activeId.current;
    const rec = id ? FocusRegistry.get(id) : undefined;
    // Slightly tighter visual scale, biased to the body's own radius.
    const targetScale = rec ? rec.distance / 5.5 : 0;
    const k = 1 - Math.exp(-2.4 * delta);
    visualScale.current += (targetScale - visualScale.current) * k;

    if (rec) ring.position.copy(rec.position);
    ring.scale.setScalar(Math.max(0.0001, visualScale.current));

    // Always face the camera; very gentle breathing pulse.
    ring.lookAt(state.camera.position);
    const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 0.9) * 0.05;
    mat.opacity = rec ? pulse * 0.14 : 0;
  });

  return (
    <mesh ref={ringRef} renderOrder={2}>
      {/* Wider, softer feathered ring — reads as a halo, not a UI gizmo. */}
      <ringGeometry args={[1.25, 1.85, 128]} />
      <meshBasicMaterial
        ref={matRef}
        color="#cfe2ff"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
