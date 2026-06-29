/**
 * Galactic procedural helpers — deterministic spiral generation.
 *
 * Everything is seeded so the same galaxy data produces identical output
 * across sessions. Lives in `sim/coords` so renderers stay generic: any
 * future galaxy can reuse the same generator by feeding different data.
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
 * warm yellow-white. Uses an exponential radial distribution.
 */
export function generateBulge(
  galaxy: GalaxyData,
  count: number,
  rand: () => number,
): GalacticPoint[] {
  const out: GalacticPoint[] = [];
  const R = galaxy.bulgeRadius;
  for (let i = 0; i < count; i++) {
    const r = -Math.log(1 - rand() * 0.95) * R * 0.35;
    const theta = rand() * Math.PI * 2;
    const cosPhi = rand() * 2 - 1;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
    const x = r * sinPhi * Math.cos(theta);
    const z = r * sinPhi * Math.sin(theta);
    const y = r * cosPhi * 0.35; // slightly flattened bulge
    // Warm color centered on yellow-white.
    const t = rand();
    out.push({
      x, y, z,
      r: 1.0,
      g: 0.86 - t * 0.12,
      b: 0.68 - t * 0.18,
      size: 0.9 + rand() * 0.6,
    });
  }
  return out;
}

/** Logarithmic-spiral arm with gaussian thickness and dust-lane bias. */
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
    // Radius along arm — biased outward, never quite reaching the rim.
    const radius = (0.18 + 0.78 * Math.sqrt(t)) * R;
    // Spiral angle following log-spiral: theta = startAngle + ln(r/r0)/pitch
    const baseTheta = arm.startAngle + Math.log(radius / (R * 0.18) + 1) / arm.pitch;
    // Arm thickness: gaussian-ish jitter perpendicular to the arm.
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const armWidth = 0.18 + (1 - radius / R) * 0.15;
    const theta = baseTheta + gauss * armWidth;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    // Disk vertical profile: thinner toward the rim.
    const vGauss =
      Math.sqrt(-2 * Math.log(Math.max(1e-6, rand()))) *
      Math.cos(2 * Math.PI * rand());
    const y = vGauss * h * (1 - 0.6 * (radius / R));

    // Colors: dust lane fraction tinted red-brown, otherwise blue-white
    // bright young stars in the arm, fading to cooler tones in interarm regions.
    const dust = rand() < 0.12;
    const sR = 1.0;
    let sG: number, sB: number;
    if (dust) {
      sG = 0.55 + rand() * 0.1;
      sB = 0.4 + rand() * 0.1;
    } else {
      const blueBias = 0.6 + 0.4 * Math.min(1, radius / (R * 0.5));
      sG = 0.86 + rand() * 0.1;
      sB = blueBias + rand() * 0.18;
    }

    out.push({
      x, y, z,
      r: sR * (dust ? 0.55 : 1),
      g: sG * (dust ? 0.55 : 1),
      b: sB * (dust ? 0.55 : 1),
      size: dust ? 0.7 + rand() * 0.4 : 0.8 + rand() * 0.9,
    });
  }
  return out;
}
