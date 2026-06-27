import type { RefObject } from "react";
import type * as THREE from "three";
import { useSimFrame } from "../useSimFrame";

/**
 * RotationComponent — reusable axial rotation driver.
 *
 * Hook form keeps the consumer free to pick its own mesh ref while staying
 * declarative. All celestial bodies (stars, planets, moons) route their
 * spin through this single implementation.
 */
export interface RotationConfig {
  /** Simulation seconds per full rotation. */
  period: number;
  /** +1 = prograde, -1 = retrograde. Defaults to +1. */
  direction?: 1 | -1;
  /** Degrees. Axial obliquity. Applied externally to the parent group. */
  axialTilt?: number;
  /** Skip rotation without unmounting. */
  enabled?: boolean;
}

export function useRotation(
  ref: RefObject<THREE.Object3D | null>,
  cfg: RotationConfig,
): void {
  const dir = cfg.direction ?? 1;
  const omega = cfg.period > 0 ? (2 * Math.PI) / cfg.period : 0;

  useSimFrame((dt) => {
    if (cfg.enabled === false) return;
    const obj = ref.current;
    if (!obj) return;
    obj.rotation.y += dt * omega * dir;
  });
}
