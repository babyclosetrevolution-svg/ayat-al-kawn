import type { CelestialBodyData } from "../../world/types/CelestialBody";
import { stellarPositionToScene } from "../../sim/coords/stellar";

/**
 * Nearby & well-known stars — Phase 9 sample.
 *
 * Each entry follows the same `CelestialBodyData` contract used by the
 * Solar System: `type: "star"`, scene-space radius, a world `position`
 * derived from real RA/Dec/distance through the ScaleManager's compressed
 * helper, and a rich `science` block. The renderer derives appearance
 * (color, glare, light) from the science metadata — no per-star shaders.
 *
 * Radii here are scene units, not physical. They are scaled so that
 * giants visibly dwarf dwarfs while staying within the navigable range.
 */

interface StarSeed {
  id: string;
  name: string;
  ra: number;
  dec: number;
  parsecs: number;
  /** Scene-space radius. */
  radius: number;
  rotationPeriod: number;
  spectralClass: string;
  effectiveTemperatureK: number;
  luminositySuns: number;
  massSuns: number;
  radiusSuns: number;
  constellation: string;
  description: string;
}

const SEEDS: StarSeed[] = [
  {
    id: "proxima-centauri",
    name: "Proxima Centauri",
    ra: 14.4966,
    dec: -62.6794,
    parsecs: 1.301,
    radius: 1.6,
    rotationPeriod: 1500,
    spectralClass: "M5.5Ve",
    effectiveTemperatureK: 3042,
    luminositySuns: 0.0017,
    massSuns: 0.122,
    radiusSuns: 0.154,
    constellation: "Centaurus",
    description:
      "The closest known star to the Sun, a small red dwarf hosting at least three confirmed planets.",
  },
  {
    id: "alpha-centauri-a",
    name: "Alpha Centauri A",
    ra: 14.6599,
    dec: -60.8354,
    parsecs: 1.339,
    radius: 3.4,
    rotationPeriod: 600,
    spectralClass: "G2V",
    effectiveTemperatureK: 5790,
    luminositySuns: 1.519,
    massSuns: 1.1,
    radiusSuns: 1.2234,
    constellation: "Centaurus",
    description:
      "The primary of the closest stellar system, a near twin of the Sun and the brightest component of α Centauri.",
  },
  {
    id: "alpha-centauri-b",
    name: "Alpha Centauri B",
    ra: 14.6601,
    dec: -60.8378,
    parsecs: 1.339,
    radius: 2.8,
    rotationPeriod: 700,
    spectralClass: "K1V",
    effectiveTemperatureK: 5260,
    luminositySuns: 0.5,
    massSuns: 0.907,
    radiusSuns: 0.8632,
    constellation: "Centaurus",
    description:
      "The K-type companion of α Centauri A, slightly cooler and dimmer than the Sun.",
  },
  {
    id: "sirius",
    name: "Sirius",
    ra: 6.7525,
    dec: -16.7161,
    parsecs: 2.6371,
    radius: 4.0,
    rotationPeriod: 520,
    spectralClass: "A1V",
    effectiveTemperatureK: 9940,
    luminositySuns: 25.4,
    massSuns: 2.063,
    radiusSuns: 1.711,
    constellation: "Canis Major",
    description:
      "The brightest star in Earth's night sky and the closest A-type main-sequence star.",
  },
  {
    id: "vega",
    name: "Vega",
    ra: 18.6156,
    dec: 38.7837,
    parsecs: 7.68,
    radius: 4.4,
    rotationPeriod: 480,
    spectralClass: "A0Va",
    effectiveTemperatureK: 9602,
    luminositySuns: 40.12,
    massSuns: 2.135,
    radiusSuns: 2.362,
    constellation: "Lyra",
    description:
      "A rapidly rotating A-type star and historical zero-point of the photometric magnitude scale.",
  },
  {
    id: "arcturus",
    name: "Arcturus",
    ra: 14.2610,
    dec: 19.1825,
    parsecs: 11.26,
    radius: 6.5,
    rotationPeriod: 450,
    spectralClass: "K1.5III",
    effectiveTemperatureK: 4286,
    luminositySuns: 170,
    massSuns: 1.08,
    radiusSuns: 25.4,
    constellation: "Boötes",
    description:
      "An orange giant, the brightest star in the northern celestial hemisphere.",
  },
  {
    id: "polaris",
    name: "Polaris",
    ra: 2.5302,
    dec: 89.2641,
    parsecs: 132.6,
    radius: 5.5,
    rotationPeriod: 500,
    spectralClass: "F7Ib",
    effectiveTemperatureK: 6015,
    luminositySuns: 2500,
    massSuns: 5.4,
    radiusSuns: 37.5,
    constellation: "Ursa Minor",
    description:
      "The current North Star, a yellow supergiant Cepheid variable near the celestial pole.",
  },
  {
    id: "betelgeuse",
    name: "Betelgeuse",
    ra: 5.9195,
    dec: 7.4071,
    parsecs: 168.1,
    radius: 9.5,
    rotationPeriod: 700,
    spectralClass: "M1-2Ia-ab",
    effectiveTemperatureK: 3500,
    luminositySuns: 126000,
    massSuns: 16.5,
    radiusSuns: 887,
    constellation: "Orion",
    description:
      "A red supergiant in Orion, one of the largest visible stars and a future supernova candidate.",
  },
  {
    id: "rigel",
    name: "Rigel",
    ra: 5.2423,
    dec: -8.2017,
    parsecs: 264.6,
    radius: 8.5,
    rotationPeriod: 520,
    spectralClass: "B8Ia",
    effectiveTemperatureK: 12100,
    luminositySuns: 120000,
    massSuns: 21,
    radiusSuns: 78.9,
    constellation: "Orion",
    description:
      "A blue supergiant marking Orion's foot, one of the most intrinsically luminous stars in our region of the Galaxy.",
  },
];

function seedToBody(s: StarSeed): CelestialBodyData {
  return {
    id: s.id,
    name: s.name,
    type: "star",
    radius: s.radius,
    rotationPeriod: s.rotationPeriod,
    position: stellarPositionToScene({
      raHours: s.ra,
      decDegrees: s.dec,
      parsecs: s.parsecs,
    }),
    focusDistanceFactor: 4,
    description: s.description,
    science: {
      classification: s.spectralClass,
      spectralClass: s.spectralClass,
      effectiveTemperatureK: s.effectiveTemperatureK,
      luminositySuns: s.luminositySuns,
      massSuns: s.massSuns,
      radiusSuns: s.radiusSuns,
      distanceParsecs: s.parsecs,
      distanceLightYears: +(s.parsecs * 3.2615637769).toFixed(3),
      constellation: s.constellation,
    },
  };
}

export const STELLAR_NEIGHBORHOOD: CelestialBodyData[] = SEEDS.map(seedToBody);
