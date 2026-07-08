import type { DeepSkyBodyData, DeepSkyKind, DeepSkyCoordinates } from "./types";
import { deepSkyPositionToScene, deepSkyDistance } from "../../sim/coords/stellar";

/**
 * Deep Sky seed catalog.
 *
 * Iconic objects only. Each record is a fully-formed CelestialBodyData
 * so the existing Knowledge, Discovery, Comparison, FocusRegistry and
 * Explorer engines pick it up without special-case logic.
 *
 * Positions are computed through the same compressed stellar projection
 * used by the nearby-star catalog, so deep-sky objects sit naturally
 * beyond the local stellar neighborhood.
 */

interface Seed {
  id: string;
  name: string;
  kind: DeepSkyKind;
  coords: DeepSkyCoordinates;
  /** Scene radius (visual proxy). */
  radius: number;
  catalogNumber?: string;
  constellation?: string;
  apparentMagnitude?: number;
  diameterLightYears?: number;
  color?: string;
  description: string;
  discovery?: string;
}

const SEEDS: Seed[] = [
  // ── Galaxies ─────────────────────────────────────────────────────────
  {
    id: "andromeda",
    name: "Andromeda Galaxy",
    kind: "galaxy",
    coords: { raHours: 0.7123, decDegrees: 41.2691, parsecs: 765_000 },
    radius: 220,
    catalogNumber: "M31 / NGC 224",
    constellation: "Andromeda",
    apparentMagnitude: 3.44,
    diameterLightYears: 220_000,
    color: "#cdd7ff",
    description:
      "The nearest large spiral galaxy to the Milky Way and the most distant object easily visible to the naked eye.",
    discovery: "Recorded by Persian astronomer al-Sufi in 964 CE.",
  },
  {
    id: "triangulum",
    name: "Triangulum Galaxy",
    kind: "galaxy",
    coords: { raHours: 1.5642, decDegrees: 30.6602, parsecs: 870_000 },
    radius: 120,
    catalogNumber: "M33 / NGC 598",
    constellation: "Triangulum",
    apparentMagnitude: 5.72,
    diameterLightYears: 60_000,
    color: "#bcd0ff",
    description:
      "A small spiral galaxy and the third-largest member of the Local Group after Andromeda and the Milky Way.",
  },
  {
    id: "lmc",
    name: "Large Magellanic Cloud",
    kind: "galaxy",
    coords: { raHours: 5.3925, decDegrees: -69.7561, parsecs: 49_970 },
    radius: 90,
    catalogNumber: "LMC",
    constellation: "Dorado / Mensa",
    apparentMagnitude: 0.9,
    diameterLightYears: 14_000,
    color: "#e6dcff",
    description:
      "A satellite dwarf galaxy of the Milky Way and the fourth-largest galaxy in the Local Group.",
  },
  {
    id: "smc",
    name: "Small Magellanic Cloud",
    kind: "galaxy",
    coords: { raHours: 0.8769, decDegrees: -72.8003, parsecs: 62_100 },
    radius: 60,
    catalogNumber: "SMC / NGC 292",
    constellation: "Tucana",
    apparentMagnitude: 2.7,
    diameterLightYears: 7_000,
    color: "#e2d8ff",
    description:
      "Companion dwarf irregular galaxy to the LMC, visible from the southern hemisphere.",
  },
  {
    id: "whirlpool",
    name: "Whirlpool Galaxy",
    kind: "galaxy",
    coords: { raHours: 13.4979, decDegrees: 47.1953, parsecs: 8_580_000 },
    radius: 80,
    catalogNumber: "M51a / NGC 5194",
    constellation: "Canes Venatici",
    apparentMagnitude: 8.4,
    diameterLightYears: 76_000,
    color: "#b8c8ff",
    description:
      "A face-on grand-design spiral interacting with the dwarf galaxy NGC 5195.",
    discovery: "Discovered by Charles Messier in 1773.",
  },
  {
    id: "sombrero",
    name: "Sombrero Galaxy",
    kind: "galaxy",
    coords: { raHours: 12.6663, decDegrees: -11.6231, parsecs: 9_550_000 },
    radius: 70,
    catalogNumber: "M104 / NGC 4594",
    constellation: "Virgo",
    apparentMagnitude: 8.0,
    diameterLightYears: 49_000,
    color: "#d8c8a8",
    description:
      "An edge-on lenticular galaxy with a prominent dust lane resembling a wide-brimmed hat.",
  },

  // ── Nebulae ──────────────────────────────────────────────────────────
  {
    id: "orion-nebula",
    name: "Orion Nebula",
    kind: "nebula",
    coords: { raHours: 5.5881, decDegrees: -5.391, parsecs: 412 },
    radius: 40,
    catalogNumber: "M42 / NGC 1976",
    constellation: "Orion",
    apparentMagnitude: 4.0,
    diameterLightYears: 24,
    color: "#ff9ab1",
    description:
      "A diffuse emission nebula and one of the closest regions of massive star formation to Earth.",
  },
  {
    id: "eagle-nebula",
    name: "Eagle Nebula",
    kind: "nebula",
    coords: { raHours: 18.3133, decDegrees: -13.7833, parsecs: 1_740 },
    radius: 35,
    catalogNumber: "M16 / NGC 6611",
    constellation: "Serpens",
    apparentMagnitude: 6.0,
    diameterLightYears: 70,
    color: "#9fe0a8",
    description:
      "Home of the 'Pillars of Creation', vast columns of cold gas sculpted by nearby young stars.",
  },
  {
    id: "lagoon-nebula",
    name: "Lagoon Nebula",
    kind: "nebula",
    coords: { raHours: 18.0578, decDegrees: -24.3867, parsecs: 1_250 },
    radius: 32,
    catalogNumber: "M8 / NGC 6523",
    constellation: "Sagittarius",
    apparentMagnitude: 6.0,
    diameterLightYears: 110,
    color: "#ffb3c0",
    description:
      "A giant interstellar cloud lit by hot O-type stars, with a distinctive lagoon-shaped dust lane.",
  },
  {
    id: "ring-nebula",
    name: "Ring Nebula",
    kind: "nebula",
    coords: { raHours: 18.8917, decDegrees: 33.0292, parsecs: 700 },
    radius: 12,
    catalogNumber: "M57 / NGC 6720",
    constellation: "Lyra",
    apparentMagnitude: 8.8,
    diameterLightYears: 1.3,
    color: "#9be6ff",
    description:
      "A planetary nebula — the glowing shell of gas ejected by a dying Sun-like star.",
  },
  {
    id: "helix-nebula",
    name: "Helix Nebula",
    kind: "nebula",
    coords: { raHours: 22.4933, decDegrees: -20.8367, parsecs: 200 },
    radius: 18,
    catalogNumber: "NGC 7293",
    constellation: "Aquarius",
    apparentMagnitude: 7.6,
    diameterLightYears: 2.5,
    color: "#7fd9ff",
    description:
      "One of the closest planetary nebulae to Earth, sometimes called the 'Eye of God'.",
  },
  {
    id: "crab-nebula",
    name: "Crab Nebula",
    kind: "supernova-remnant",
    coords: { raHours: 5.5755, decDegrees: 22.0145, parsecs: 2_000 },
    radius: 22,
    catalogNumber: "M1 / NGC 1952",
    constellation: "Taurus",
    apparentMagnitude: 8.4,
    diameterLightYears: 11,
    color: "#ffd28c",
    description:
      "The expanding remnant of a supernova witnessed by Chinese astronomers in 1054 CE.",
    discovery: "Identified by John Bevis in 1731; cataloged by Messier in 1758.",
  },

  // ── Clusters ─────────────────────────────────────────────────────────
  {
    id: "pleiades",
    name: "Pleiades",
    kind: "open-cluster",
    coords: { raHours: 3.7917, decDegrees: 24.1167, parsecs: 136 },
    radius: 28,
    catalogNumber: "M45",
    constellation: "Taurus",
    apparentMagnitude: 1.6,
    diameterLightYears: 8,
    color: "#bcd2ff",
    description:
      "A young open cluster of hot blue B-type stars, prominent in autumn and winter skies.",
  },
  {
    id: "omega-centauri",
    name: "Omega Centauri",
    kind: "globular-cluster",
    coords: { raHours: 13.4467, decDegrees: -47.4794, parsecs: 5_240 },
    radius: 38,
    catalogNumber: "NGC 5139",
    constellation: "Centaurus",
    apparentMagnitude: 3.9,
    diameterLightYears: 150,
    color: "#ffefcc",
    description:
      "The largest and brightest globular cluster orbiting the Milky Way, holding millions of ancient stars.",
  },
  {
    id: "hercules-cluster",
    name: "Hercules Globular Cluster",
    kind: "globular-cluster",
    coords: { raHours: 16.6949, decDegrees: 36.4613, parsecs: 7_220 },
    radius: 30,
    catalogNumber: "M13 / NGC 6205",
    constellation: "Hercules",
    apparentMagnitude: 5.8,
    diameterLightYears: 145,
    color: "#ffe6b8",
    description:
      "A bright northern globular cluster, target of the 1974 Arecibo Message broadcast.",
  },
];

function seedToBody(s: Seed): DeepSkyBodyData {
  const lightYears = +(s.coords.parsecs * 3.2615637769).toFixed(1);
  // Phase 23: radii scale with scene distance so distant galaxies stay
  // small on screen even after being pushed far out. Nearby nebulae keep
  // most of their visual footprint; extragalactic objects shrink hard so
  // they read as distant structures, never decorative props.
  const sceneD = deepSkyDistance(s.coords.parsecs);
  const isExtragalactic = s.coords.parsecs > 10_000;
  const radiusScale = isExtragalactic
    ? Math.min(1, 26_000 / sceneD) * 0.55
    : 0.75;
  return {
    id: s.id,
    name: s.name,
    type: s.kind,
    radius: Math.max(4, s.radius * radiusScale),
    rotationPeriod: 0,
    position: deepSkyPositionToScene(s.coords),
    material: { kind: "rock", color: s.color ?? "#bcd0ff" },
    focusDistanceFactor: 4,
    description: s.description,
    science: {
      classification: s.kind.replace("-", " "),
      distanceParsecs: s.coords.parsecs,
      distanceLightYears: lightYears,
      constellation: s.constellation,
    },
    deepSky: {
      kind: s.kind,
      catalogNumber: s.catalogNumber,
      constellation: s.constellation,
      apparentMagnitude: s.apparentMagnitude,
      distanceLightYears: lightYears,
      diameterLightYears: s.diameterLightYears,
      discovery: s.discovery,
      gallery: [],
      references: [],
    },
  };
}

export const DEEP_SKY_CATALOG: DeepSkyBodyData[] = SEEDS.map(seedToBody);

export const DEEP_SKY_BY_KIND: Record<DeepSkyKind, DeepSkyBodyData[]> = {
  "galaxy": [],
  "nebula": [],
  "star-cluster": [],
  "globular-cluster": [],
  "open-cluster": [],
  "supernova-remnant": [],
};
for (const b of DEEP_SKY_CATALOG) DEEP_SKY_BY_KIND[b.deepSky.kind].push(b);
