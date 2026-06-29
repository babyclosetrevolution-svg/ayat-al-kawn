/**
 * Stellar coordinate helpers — Phase 9 (compressed exploration scale).
 *
 * Real interstellar distances would put even Proxima Centauri millions of
 * scene units away from the Solar System. We instead use a logarithmic
 * compression so the nearest stars sit just beyond the orbit of Neptune,
 * with farther stars stretching out into deep space proportionally.
 *
 * The Sun stays at scene origin. ScaleManager owns the compression curve
 * so future astronomical-scale work only has to swap the helper.
 */
import type { Vector3Tuple } from "three";

// Anchor: Neptune sits at ~340 scene units. Stars start just beyond.
const STAR_BASE_DISTANCE = 420;
const STAR_LOG_SCALE = 140;

export interface StellarCoordinates {
  /** Right Ascension in hours (0..24). */
  raHours: number;
  /** Declination in degrees (-90..90). */
  decDegrees: number;
  /** Distance from the Sun in parsecs. */
  parsecs: number;
}

/**
 * Convert equatorial (RA, Dec, distance) to compressed scene-space
 * coordinates. Direction is preserved; distance is logarithmically
 * compressed so the local neighborhood is navigable.
 */
export function stellarPositionToScene(c: StellarCoordinates): Vector3Tuple {
  const ra = (c.raHours / 24) * Math.PI * 2;
  const dec = (c.decDegrees * Math.PI) / 180;

  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.sin(dec);
  const z = -Math.cos(dec) * Math.sin(ra);

  const d = compressDistance(c.parsecs);
  return [x * d, y * d, z * d];
}

/**
 * Compressed exploration distance for a stellar parsec value.
 * The curve keeps Proxima (~1.3 pc) close to Neptune and distant
 * supergiants like Rigel (~265 pc) within a few thousand scene units.
 */
export function compressDistance(parsecs: number): number {
  const p = Math.max(0.1, parsecs);
  return STAR_BASE_DISTANCE + STAR_LOG_SCALE * Math.log10(p + 1);
}
