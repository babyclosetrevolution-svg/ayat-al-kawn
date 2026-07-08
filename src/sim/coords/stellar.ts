/**
 * Stellar / deep-sky coordinate helpers.
 *
 * Real interstellar distances would put even Proxima Centauri millions of
 * scene units away from the Solar System. We compress distances so the
 * cosmos remains navigable — but Phase 23 (Real Universe Hierarchy)
 * splits the compression into distinct layers so the sense of scale
 * across cosmic magnitudes never collapses:
 *
 *   - stellarPositionToScene  → local nearby stars (< ~500 pc).
 *   - deepSkyPositionToScene  → intra-galactic (< 10 kpc) and
 *                                extragalactic (> 10 kpc) with a much
 *                                harder push outward. Distant galaxies
 *                                MUST read as distant, not decorative.
 */
import type { Vector3Tuple } from "three";

// Anchor: Neptune sits at ~816 scene units (340 × 2.4 with DISTANCE_SCALE).
// Stars start just beyond, at a comfortable exploration distance.
const STAR_BASE_DISTANCE = 900;
const STAR_LOG_SCALE = 160;

// Deep-sky anchors. Intra-galactic objects (nebulae, clusters) sit at a
// clear layer beyond the local stellar neighborhood. Extragalactic
// objects (galaxies) are pushed several orders of magnitude further so
// Andromeda reads as an unreachable structure, not a nearby light.
const DEEP_SKY_INTRA_BASE = 4_200;
const DEEP_SKY_INTRA_SCALE = 260;
const DEEP_SKY_EXTRA_BASE = 24_000;
const DEEP_SKY_EXTRA_SCALE = 6_800;
const EXTRAGALACTIC_THRESHOLD_PC = 10_000;

export interface StellarCoordinates {
  /** Right Ascension in hours (0..24). */
  raHours: number;
  /** Declination in degrees (-90..90). */
  decDegrees: number;
  /** Distance from the Sun in parsecs. */
  parsecs: number;
}

function directionUnit(c: StellarCoordinates): [number, number, number] {
  const ra = (c.raHours / 24) * Math.PI * 2;
  const dec = (c.decDegrees * Math.PI) / 180;
  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.sin(dec);
  const z = -Math.cos(dec) * Math.sin(ra);
  return [x, y, z];
}

/**
 * Convert equatorial (RA, Dec, distance) to compressed scene-space
 * coordinates for a nearby star. Direction is preserved; distance is
 * logarithmically compressed so the local neighborhood is navigable.
 */
export function stellarPositionToScene(c: StellarCoordinates): Vector3Tuple {
  const [x, y, z] = directionUnit(c);
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

/**
 * Deep-sky projection with two regimes so galaxies do not collapse into
 * the same visual shell as local nebulae. Intra-galactic distances are
 * only mildly compressed; extragalactic distances are pushed hard so a
 * galaxy at ~10 Mpc lives tens of thousands of scene units away.
 */
export function deepSkyPositionToScene(c: StellarCoordinates): Vector3Tuple {
  const [x, y, z] = directionUnit(c);
  const d = deepSkyDistance(c.parsecs);
  return [x * d, y * d, z * d];
}

export function deepSkyDistance(parsecs: number): number {
  const p = Math.max(1, parsecs);
  if (p < EXTRAGALACTIC_THRESHOLD_PC) {
    // Intra-galactic — smooth continuation past the stellar shell.
    return DEEP_SKY_INTRA_BASE + DEEP_SKY_INTRA_SCALE * Math.log10(p + 1);
  }
  // Extragalactic — log-scale in Mpc, aggressively pushed outward.
  const mpc = p / 1_000_000;
  return DEEP_SKY_EXTRA_BASE + DEEP_SKY_EXTRA_SCALE * Math.log10(mpc * 10 + 1);
}
