/**
 * Milky Way — structured galactic dataset.
 *
 * Data-only: the procedural renderer in `src/world/objects/MilkyWayGalaxy.tsx`
 * reads this file (via the `galaxies` catalog) to assemble a deterministic,
 * extensible representation. Adding new arms, regions or reference points
 * here is enough — no renderer change required.
 */
import type { Vector3Tuple } from "three";

export interface GalacticArm {
  id: string;
  name: string;
  /** Starting angle of the arm, radians. */
  startAngle: number;
  /** Pitch angle, radians (log-spiral tightness). */
  pitch: number;
  /** Angular sweep, radians. */
  sweep: number;
  /** Local star count contribution. */
  starCount: number;
}

export interface StellarRegion {
  id: string;
  name: string;
  /** Local center within the galactic plane (scene units, galaxy-local). */
  center: Vector3Tuple;
  radius: number;
  description?: string;
}

export interface GalaxyReferenceStar {
  id: string;
  name: string;
  /** Galaxy-local cartesian, scene units. */
  position: Vector3Tuple;
}

export interface GalaxyData {
  id: string;
  name: string;
  classification: string;
  /** Scene-space center of the galaxy (where the supermassive BH sits). */
  center: Vector3Tuple;
  /** Disk radius in scene units. */
  diskRadius: number;
  /** Bulge radius in scene units. */
  bulgeRadius: number;
  /** Disk thickness in scene units (z half-extent). */
  diskThickness: number;
  /** Deterministic PRNG seed. */
  seed: number;
  /** Total approximate star count for the procedural disk. */
  starCount: number;
  arms: GalacticArm[];
  regions: StellarRegion[];
  referenceStars: GalaxyReferenceStar[];
  description?: string;
  science?: {
    diameterLightYears?: number;
    massSolarMasses?: number;
    starCountEstimate?: string;
    ageBillionYears?: number;
    classificationDetail?: string;
  };
}

// The Sun sits ~8 kpc from the galactic center, inside the Orion Spur. We
// place the galactic center far below/behind the Solar System so the local
// stellar neighborhood remains comfortable to explore, and pulling out to
// the galaxy frames a believable spiral structure.
const SUN_OFFSET: Vector3Tuple = [2400, -120, 0];

export const MILKY_WAY: GalaxyData = {
  id: "milky-way",
  name: "Milky Way",
  classification: "Barred spiral · SBbc",
  // Galactic center placed so the Solar System (scene origin) ends up in
  // the Orion Spur, ~8 kpc out from the core.
  center: [-SUN_OFFSET[0], -SUN_OFFSET[1], -SUN_OFFSET[2]],
  diskRadius: 6000,
  bulgeRadius: 900,
  diskThickness: 90,
  seed: 0x5eed1ce,
  starCount: 24000,
  arms: [
    { id: "perseus", name: "Perseus Arm", startAngle: 0, pitch: 0.22, sweep: Math.PI * 1.4, starCount: 5200 },
    { id: "scutum-centaurus", name: "Scutum–Centaurus Arm", startAngle: Math.PI * 0.5, pitch: 0.22, sweep: Math.PI * 1.4, starCount: 5200 },
    { id: "sagittarius-carina", name: "Sagittarius–Carina Arm", startAngle: Math.PI, pitch: 0.22, sweep: Math.PI * 1.4, starCount: 4400 },
    { id: "norma", name: "Norma Arm", startAngle: Math.PI * 1.5, pitch: 0.22, sweep: Math.PI * 1.2, starCount: 3800 },
    { id: "orion-spur", name: "Orion Spur", startAngle: Math.PI * 0.25, pitch: 0.18, sweep: Math.PI * 0.6, starCount: 1400 },
  ],
  regions: [
    { id: "galactic-core", name: "Galactic Core", center: [0, 0, 0], radius: 700, description: "Dense central bulge surrounding Sagittarius A*." },
    { id: "orion-spur", name: "Orion Spur", center: SUN_OFFSET, radius: 320, description: "Minor arm fragment hosting the Solar System." },
    { id: "local-bubble", name: "Local Bubble", center: SUN_OFFSET, radius: 80, description: "Low-density cavity carved by ancient supernovae around the Sun." },
  ],
  referenceStars: [
    { id: "sol-reference", name: "Sun", position: SUN_OFFSET },
  ],
  description:
    "Our home galaxy: a barred spiral roughly 100,000 light-years across, containing several hundred billion stars and a supermassive black hole at its center.",
  science: {
    diameterLightYears: 100000,
    massSolarMasses: 1.5e12,
    starCountEstimate: "100–400 billion",
    ageBillionYears: 13.6,
    classificationDetail: "Barred spiral galaxy, Hubble type SBbc",
  },
};

export const GALAXY_CATALOG: GalaxyData[] = [MILKY_WAY];
