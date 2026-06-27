import type { RefObject } from "react";
import type * as THREE from "three";
import { useSimFrame } from "../useSimFrame";

/**
 * OrbitComponent — reusable orbital motion driver.
 *
 * Phase 4 ships circular orbits. The configuration shape already carries
 * `eccentricity` / `argumentOfPeriapsis` slots so elliptical Keplerian
 * solvers can drop in later without breaking call sites. Consumers do not
 * read those fields yet.
 */
export interface OrbitConfig {
  /** Logical parent body id (the scene graph supplies the actual frame). */
  parentId: string;
  /** Scene-space semi-major axis (or radius for circular orbits). */
  radius: number;
  /** Simulation seconds per revolution. */
  period: number;
  /** Degrees. */
  inclination?: number;
  /** Radians. Initial mean anomaly. */
  phase?: number;
  /** Reserved for future elliptical support. */
  eccentricity?: number;
  /** Reserved for future elliptical support. Degrees. */
  argumentOfPeriapsis?: number;
  /** Skip motion without unmounting. */
  enabled?: boolean;
}

/**
 * Drives the rotation of a pivot group sitting at the parent's origin.
 * The satellite mesh sits at `(radius, 0, 0)` inside the pivot, so spinning
 * the pivot around Y produces a circular orbit. Inclination is applied as
 * a static tilt on the pivot's parent frame (caller responsibility).
 */
export function useOrbit(
  pivotRef: RefObject<THREE.Object3D | null>,
  cfg: OrbitConfig,
): void {
  const omega = cfg.period > 0 ? (2 * Math.PI) / cfg.period : 0;

  useSimFrame((dt) => {
    if (cfg.enabled === false) return;
    const piv = pivotRef.current;
    if (!piv) return;
    piv.rotation.y += dt * omega;
  });
}
