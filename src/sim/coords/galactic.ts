/**
 * Galactic procedural helpers — deterministic spiral generation.
 *
 * Everything is seeded so the same galaxy data produces identical output
 * across sessions. Lives in `sim/coords` so renderers stay generic: any
 * future galaxy can reuse the same generator by feeding different data.
 *
 * Phase 11.5 refinement: stronger arm definition, exponential radial
 * density falloff, brighter bulge, color-temperature variation tied to
 * radial position, and a thin dust-lane bias offset toward the inner
 * edge of each arm.
 */
import type { GalaxyData, GalacticArm } from "../../data/galaxy/milky-way";

/** Mulberry32 — small deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller standard normal sample. */
function gaussian(rand: () => number): number {
  const u = Math.max(1e-6, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export interface GalacticPoint {
  /** Galaxy-local position. */
  x: number;
  y: number;
  z: number;
  /** Color tint (linear RGB 0..1). */
  r: number;
  g: number;
  b: number;
  /** Point size multiplier. */
  size: number;
}

/**
 * Generate the bulge stars — concentrated near the galactic center,
 * warm yellow-white. Uses an exponential radial distribution that drops
 * off sharply so the core reads as dense and luminous.
 */
export function generateBulge(
  galaxy: GalaxyData,
  count: number,
  rand: () => number,
): GalacticPoint[] {
  const out: GalacticPoint[] = [];
  const R = galaxy.bulgeRadius;
  for (let i = 0; i < count; i++) {
    // Tight exponential profile — peaks at center, ~95% within R.
    const r = -Math.log(1 - rand() * 0.97) * R * 0.28;
    const theta = rand() * Math.PI * 2;
    const cosPhi = rand() * 2 - 1;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
    const x = r * sinPhi * Math.cos(theta);
    const z = r * sinPhi * Math.sin(theta);
    const y = r * cosPhi * 0.32; // slightly flattened bulge
    // Center → near-white, edge → warm amber. Brighter near core.
    const radialT = Math.min(1, r / (R * 1.1));
    const warmth = 0.92 - radialT * 0.18;
    const blue = 0.78 - radialT * 0.28;
    const jitter = (rand() - 0.5) * 0.06;
    out.push({
      x, y, z,
      r: 1.0,
      g: warmth + jitter,
      b: Math.max(0.35, blue + jitter * 0.5),
      // Bulge stars are visually larger near the core to suggest density.
      size: 1.0 + (1 - radialT) * 1.4 + rand() * 0.5,
    });
  }
  return out;
}

/**
 * Logarithmic-spiral arm with tight perpendicular distribution, dust-lane
 * inner edge, and stochastic stellar clusters for non-uniform density.
 */
export function generateArm(
  galaxy: GalaxyData,
  arm: GalacticArm,
  rand: () => number,
): GalacticPoint[] {
  const out: GalacticPoint[] = [];
  const R = galaxy.diskRadius;
  const h = galaxy.diskThickness;
  for (let i = 0; i < arm.starCount; i++) {
    const t = rand();
    // Radius along arm — exponential disk profile, biased outward
    // without quite reaching the rim.
    const radius = (0.18 + 0.78 * Math.sqrt(t)) * R;
    const radialT = radius / R;
    // Spiral angle following log-spiral: theta = startAngle + ln(r/r0)/pitch
    const baseTheta = arm.startAngle + Math.log(radius / (R * 0.18) + 1) / arm.pitch;

    // Tight gaussian arm width, narrower toward the rim. Cluster bias
    // gives non-uniform density — small chance of a tighter sub-arm.
    const cluster = rand() < 0.18 ? 0.35 : 1.0;
    const armWidth = (0.085 + (1 - radialT) * 0.12) * cluster;
    const transverse = gaussian(rand) * armWidth;
    const theta = baseTheta + transverse;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    // Disk vertical profile: thinner toward the rim, gaussian in y.
    const y = gaussian(rand) * h * (1 - 0.6 * radialT) * 0.55;

    // Dust lanes sit on the inner edge of each arm — bias by transverse sign.
    const dustChance = transverse < 0 ? 0.18 : 0.06;
    const dust = rand() < dustChance;

    // Color temperature gradient: inner arm = warmer (older pop II), outer
    // arm = bluer (young O/B), with rare deep-red M giants throughout.
    let cr: number, cg: number, cb: number, sz: number;
    if (dust) {
      // Brown-red dust grain absorption tint.
      cr = 0.42 + rand() * 0.1;
      cg = 0.26 + rand() * 0.08;
      cb = 0.18 + rand() * 0.06;
      sz = 0.6 + rand() * 0.4;
    } else {
      const blueBias = 0.5 + 0.5 * radialT;
      const isHot = rand() < blueBias * 0.35;
      const isCoolGiant = rand() < 0.04;
      if (isHot) {
        cr = 0.78 + rand() * 0.1;
        cg = 0.86 + rand() * 0.08;
        cb = 1.0;
        sz = 1.4 + rand() * 1.2;
      } else if (isCoolGiant) {
        cr = 1.0;
        cg = 0.55 + rand() * 0.1;
        cb = 0.42 + rand() * 0.08;
        sz = 1.2 + rand() * 0.8;
      } else {
        // Common G/K main-sequence — warm white.
        cr = 1.0;
        cg = 0.92 + rand() * 0.06;
        cb = 0.82 + rand() * 0.1 - radialT * 0.05;
        sz = 0.75 + rand() * 0.7;
      }
    }

    out.push({ x, y, z, r: cr, g: cg, b: cb, size: sz });
  }
  return out;
}

/**
 * Spherical halo of faint old population II stars surrounding the disk.
 * Subtle but essential — gives the galaxy three-dimensionality.
 */
export function generateHalo(
  galaxy: GalaxyData,
  count: number,
  rand: () => number,
): GalacticPoint[] {
  const out: GalacticPoint[] = [];
  const R = galaxy.diskRadius;
  for (let i = 0; i < count; i++) {
    // Exponential radial profile reaching beyond the disk.
    const r = -Math.log(1 - rand() * 0.98) * R * 0.55;
    const theta = rand() * Math.PI * 2;
    const cosPhi = rand() * 2 - 1;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
    out.push({
      x: r * sinPhi * Math.cos(theta),
      y: r * cosPhi,
      z: r * sinPhi * Math.sin(theta),
      // Old, warm, dim population.
      r: 0.85 + rand() * 0.1,
      g: 0.7 + rand() * 0.08,
      b: 0.55 + rand() * 0.08,
      size: 0.4 + rand() * 0.5,
    });
  }
  return out;
}
