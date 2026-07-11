import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * CosmicLayer — Phase 22.7.
 *
 * Wraps a slice of the scene graph and toggles / fades its visibility
 * based on the camera's distance from the origin (galactic centre).
 *
 * This is how the opening "vide immense" is maintained: near objects
 * (Solar System) disappear as the Observer pulls out, distant objects
 * (galaxies) barely register until the Observer has traveled far
 * enough for them to become the meaningful subject.
 *
 * Fade is applied to `<group>` opacity only — never to individual
 * shader materials — so we never break sorting or PBR pipelines.
 * A group's `visible` flag is flipped once fade drops below the
 * imperceptibility threshold so hidden layers cost zero draw calls.
 */
export function CosmicLayer({
  near = 0,
  far = Number.POSITIVE_INFINITY,
  softness = 0.35,
  children,
}: {
  /** Below this pivot distance the layer is fully visible. */
  near?: number;
  /** Beyond this pivot distance the layer is invisible. */
  far?: number;
  /**
   * Fraction of the range used for the fade-in and fade-out edges
   * (0.35 → 35% of the distance to `near`/`far` is a soft fringe).
   */
  softness?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const factorRef = useRef(0);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    const d = camera.position.length();
    // Compute a 0..1 factor from a trapezoid: 0 outside [near,far],
    // 1 well inside, soft edges of width `softness * (near|far)`.
    const softNear = Math.max(1, near * softness);
    const softFar = Math.max(1, far * softness);
    let f: number;
    if (d < near - softNear || d > far + softFar) f = 0;
    else if (d < near) f = 1 - (near - d) / softNear;
    else if (d > far) f = 1 - (d - far) / softFar;
    else f = 1;
    f = THREE.MathUtils.clamp(f, 0, 1);
    // Ease so the emergence feels natural, never linear-bright.
    const eased = f * f * (3 - 2 * f);
    factorRef.current = eased;
    ref.current.visible = eased > 0.01;
    // Fade at the group level — traversing children keeps existing
    // materials untouched. We rely on the fact that pointsMaterial
    // and additive shaders honour their parent's world opacity via
    // a per-material multiplier we set below only where safe.
    ref.current.traverse((obj) => {
      const mat = (obj as unknown as { material?: THREE.Material | THREE.Material[] }).material;
      if (!mat) return;
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        // Only fade materials that are already transparent-safe —
        // additive points, sprites, shader hazes. Never opaque PBR.
        const anyM = m as THREE.Material & { opacity?: number; userData: { __baseOpacity?: number } };
        if (!m.transparent) continue;
        if (anyM.userData.__baseOpacity === undefined) {
          anyM.userData.__baseOpacity = anyM.opacity ?? 1;
        }
        anyM.opacity = (anyM.userData.__baseOpacity ?? 1) * eased;
      }
    });
  });

  return <group ref={ref}>{children}</group>;
}
