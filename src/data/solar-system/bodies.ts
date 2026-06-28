import type { CelestialBodyData } from "../../world/types/CelestialBody";

/**
 * Solar-system body registry — Phase 5.
 *
 * Distances and radii are scaled for exploration, not realism: real ratios
 * (Sun 109× Earth, Neptune 30 AU) would make every body invisible at the
 * working camera range. Order of magnitude relationships are preserved so
 * gas giants still feel large compared to terrestrials, and outer planets
 * remain clearly farther than inner ones.
 *
 * All physical facts live under `science` — those are the real-world values
 * and remain unscaled for future encyclopedia / comparator UIs.
 */
const TEX =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets";

// ── Inner planets ────────────────────────────────────────────────────────
const MERCURY: CelestialBodyData = {
  id: "mercury",
  name: "Mercury",
  type: "planet",
  radius: 0.9,
  rotationPeriod: 280,
  axialTilt: 0.03,
  orbit: { parentId: "sun", distance: 24, period: 40, phase: 0.3 },
  material: { kind: "rock", color: "#9a8c7a", roughness: 1 },
  focusDistanceFactor: 5,
  description: "The smallest planet and closest to the Sun.",
  science: {
    radiusKm: 2_439.7,
    gravity: 3.7,
    temperatureK: 440,
    rotationPeriodHours: 1407.6,
    orbitalPeriodDays: 87.97,
    semiMajorAxisAU: 0.387,
    massEarths: 0.0553,
    moonCount: 0,
    classification: "Terrestrial",
  },
};

const VENUS: CelestialBodyData = {
  id: "venus",
  name: "Venus",
  type: "planet",
  radius: 1.55,
  rotationPeriod: 900,
  axialTilt: 177.4,
  orbit: { parentId: "sun", distance: 36, period: 75, phase: 1.4 },
  material: { kind: "desert", color: "#e7c98c" },
  atmosphere: { color: "#f5d68a", intensity: 1.2, scale: 1.06 },
  focusDistanceFactor: 4.5,
  description: "Shrouded in a thick CO₂ atmosphere and the hottest planet.",
  science: {
    radiusKm: 6_051.8,
    gravity: 8.87,
    temperatureK: 737,
    rotationPeriodHours: -5832.5,
    orbitalPeriodDays: 224.7,
    semiMajorAxisAU: 0.723,
    massEarths: 0.815,
    moonCount: 0,
    classification: "Terrestrial",
  },
};

const EARTH: CelestialBodyData = {
  id: "earth",
  name: "Earth",
  type: "planet",
  radius: 1.7,
  rotationPeriod: 157,
  axialTilt: 23.4,
  orbit: { parentId: "sun", distance: 52, period: 120, phase: 2.6 },
  textures: {
    map: `${TEX}/earth_atmos_2048.jpg`,
    normalMap: `${TEX}/earth_normal_2048.jpg`,
    specularMap: `${TEX}/earth_specular_2048.jpg`,
  },
  material: { kind: "earthlike", shininess: 18, specularColor: "#333a48" },
  atmosphere: { color: "#5aa9ff", intensity: 1, scale: 1.08 },
  clouds: {
    texture: `${TEX}/earth_clouds_1024.png`,
    opacity: 0.55,
    speed: 1.25,
    scale: 1.015,
  },
  focusDistanceFactor: 4,
  description: "The only known world that harbors life.",
  science: {
    radiusKm: 6_378.1,
    gravity: 9.807,
    temperatureK: 288,
    rotationPeriodHours: 23.9345,
    orbitalPeriodDays: 365.256,
    semiMajorAxisAU: 1,
    massEarths: 1,
    moonCount: 1,
    classification: "Terrestrial",
  },
};

const MARS: CelestialBodyData = {
  id: "mars",
  name: "Mars",
  type: "planet",
  radius: 1.2,
  rotationPeriod: 160,
  axialTilt: 25.2,
  orbit: { parentId: "sun", distance: 72, period: 220, phase: 4.1 },
  material: { kind: "desert", color: "#c1502a", roughness: 0.95 },
  atmosphere: { color: "#e89a6a", intensity: 0.4, scale: 1.05 },
  focusDistanceFactor: 4.5,
  description: "The cold desert world that has fascinated humanity for centuries.",
  science: {
    radiusKm: 3_389.5,
    gravity: 3.71,
    temperatureK: 210,
    rotationPeriodHours: 24.6229,
    orbitalPeriodDays: 686.98,
    semiMajorAxisAU: 1.524,
    massEarths: 0.107,
    moonCount: 2,
    classification: "Terrestrial",
  },
};

// ── Outer planets ────────────────────────────────────────────────────────
const JUPITER: CelestialBodyData = {
  id: "jupiter",
  name: "Jupiter",
  type: "planet",
  radius: 5.4,
  rotationPeriod: 50,
  axialTilt: 3.1,
  orbit: { parentId: "sun", distance: 130, period: 800, phase: 0.7 },
  material: { kind: "gas", color: "#d6b58a" },
  atmosphere: { color: "#e1c9a4", intensity: 0.5, scale: 1.04 },
  focusDistanceFactor: 3,
  description: "The largest planet, a gas giant with a great red storm.",
  science: {
    radiusKm: 69_911,
    gravity: 24.79,
    temperatureK: 165,
    rotationPeriodHours: 9.9259,
    orbitalPeriodDays: 4_332.59,
    semiMajorAxisAU: 5.203,
    massEarths: 317.8,
    moonCount: 95,
    classification: "Gas Giant",
  },
};

const SATURN: CelestialBodyData = {
  id: "saturn",
  name: "Saturn",
  type: "planet",
  radius: 4.6,
  rotationPeriod: 55,
  axialTilt: 26.7,
  orbit: { parentId: "sun", distance: 200, period: 1600, phase: 3.3 },
  material: { kind: "gas", color: "#e8d49a" },
  atmosphere: { color: "#f0dcaa", intensity: 0.4, scale: 1.04 },
  rings: {
    innerRadius: 5.8,
    outerRadius: 10.4,
    color: "#e6d3a5",
    opacity: 0.95,
  },
  focusDistanceFactor: 4,
  description: "The jewel of the Solar System, defined by its spectacular ring system.",
  science: {
    radiusKm: 58_232,
    gravity: 10.44,
    temperatureK: 134,
    rotationPeriodHours: 10.656,
    orbitalPeriodDays: 10_759.22,
    semiMajorAxisAU: 9.537,
    massEarths: 95.16,
    moonCount: 146,
    classification: "Gas Giant",
  },
};

const URANUS: CelestialBodyData = {
  id: "uranus",
  name: "Uranus",
  type: "planet",
  radius: 2.8,
  rotationPeriod: 90,
  axialTilt: 97.8,
  orbit: { parentId: "sun", distance: 270, period: 3000, phase: 5.7 },
  material: { kind: "ice", color: "#9ee0e3" },
  atmosphere: { color: "#b8ecef", intensity: 0.6, scale: 1.05 },
  rings: {
    innerRadius: 3.3,
    outerRadius: 4.6,
    color: "#9bb8c8",
    opacity: 0.35,
  },
  focusDistanceFactor: 4,
  description: "The sideways ice giant, tipped almost perpendicular to its orbit.",
  science: {
    radiusKm: 25_362,
    gravity: 8.69,
    temperatureK: 76,
    rotationPeriodHours: -17.24,
    orbitalPeriodDays: 30_688.5,
    semiMajorAxisAU: 19.191,
    massEarths: 14.54,
    moonCount: 27,
    classification: "Ice Giant",
  },
};

const NEPTUNE: CelestialBodyData = {
  id: "neptune",
  name: "Neptune",
  type: "planet",
  radius: 2.7,
  rotationPeriod: 90,
  axialTilt: 28.3,
  orbit: { parentId: "sun", distance: 340, period: 4800, phase: 1.9 },
  material: { kind: "ice", color: "#3a6fd6" },
  atmosphere: { color: "#5e9bff", intensity: 0.8, scale: 1.05 },
  focusDistanceFactor: 4,
  description: "The windiest planet, a deep-blue ice giant at the edge of the planetary system.",
  science: {
    radiusKm: 24_622,
    gravity: 11.15,
    temperatureK: 72,
    rotationPeriodHours: 16.11,
    orbitalPeriodDays: 60_182,
    semiMajorAxisAU: 30.069,
    massEarths: 17.15,
    moonCount: 14,
    classification: "Ice Giant",
  },
};

// ── The Sun ──────────────────────────────────────────────────────────────
const SUN: CelestialBodyData = {
  id: "sun",
  name: "Sun",
  type: "star",
  radius: 11,
  rotationPeriod: 400,
  position: [0, 0, 0],
  emissive: {
    color: "#ffd089",
    intensity: 1,
    lightColor: "#fff1d0",
    lightIntensity: 4.5,
    halos: [
      { color: "#ffc869", opacity: 0.18, scale: 1.08 },
      { color: "#ff9a3c", opacity: 0.07, scale: 1.4 },
    ],
  },
  focusDistanceFactor: 3,
  description: "G-type main-sequence star at the heart of the Solar System.",
  science: {
    radiusKm: 695_700,
    gravity: 274,
    temperatureK: 5_772,
    rotationPeriodHours: 609.12,
    massEarths: 333_000,
    classification: "G2V Main-Sequence Star",
  },
};

// ── Major moons ──────────────────────────────────────────────────────────
const MOON: CelestialBodyData = {
  id: "moon",
  name: "Moon",
  type: "moon",
  radius: 0.45,
  rotationPeriod: 105,
  orbit: { parentId: "earth", distance: 3.8, period: 105 },
  textures: { map: `${TEX}/moon_1024.jpg` },
  material: { kind: "rock" },
  focusDistanceFactor: 6,
  description: "Earth's only natural satellite, tidally locked to its primary.",
  science: {
    radiusKm: 1_737.4,
    gravity: 1.62,
    temperatureK: 250,
    rotationPeriodHours: 655.7,
    orbitalPeriodDays: 27.32,
    semiMajorAxisKm: 384_400,
    massEarths: 0.0123,
    classification: "Natural Satellite",
  },
};

const martian = (
  id: string,
  name: string,
  radius: number,
  distance: number,
  period: number,
  facts: Partial<CelestialBodyData["science"]>,
): CelestialBodyData => ({
  id,
  name,
  type: "moon",
  radius,
  rotationPeriod: period,
  orbit: { parentId: "mars", distance, period },
  material: { kind: "rock", color: "#8c7a68" },
  focusDistanceFactor: 8,
  science: { classification: "Natural Satellite", ...facts },
});

const PHOBOS = martian("phobos", "Phobos", 0.12, 2.0, 30, {
  radiusKm: 11.27,
  orbitalPeriodDays: 0.319,
});
const DEIMOS = martian("deimos", "Deimos", 0.08, 2.6, 75, {
  radiusKm: 6.2,
  orbitalPeriodDays: 1.263,
});

const galilean = (
  id: string,
  name: string,
  radius: number,
  distance: number,
  period: number,
  color: string,
  facts: Partial<CelestialBodyData["science"]>,
): CelestialBodyData => ({
  id,
  name,
  type: "moon",
  radius,
  rotationPeriod: period,
  orbit: { parentId: "jupiter", distance, period },
  material: { kind: "rock", color },
  focusDistanceFactor: 6,
  science: { classification: "Galilean Moon", ...facts },
});

const IO = galilean("io", "Io", 0.34, 7.4, 42, "#e7d36a", {
  radiusKm: 1_821.6,
  gravity: 1.796,
  temperatureK: 110,
  orbitalPeriodDays: 1.769,
});
const EUROPA = galilean("europa", "Europa", 0.3, 9.0, 85, "#dcd4c1", {
  radiusKm: 1_560.8,
  gravity: 1.314,
  temperatureK: 102,
  orbitalPeriodDays: 3.551,
});
const GANYMEDE = galilean("ganymede", "Ganymede", 0.5, 11.2, 170, "#a6957d", {
  radiusKm: 2_634.1,
  gravity: 1.428,
  temperatureK: 110,
  orbitalPeriodDays: 7.155,
});
const CALLISTO = galilean("callisto", "Callisto", 0.46, 14.5, 400, "#6a6258", {
  radiusKm: 2_410.3,
  gravity: 1.235,
  temperatureK: 134,
  orbitalPeriodDays: 16.689,
});

const saturnMoon = (
  id: string,
  name: string,
  radius: number,
  distance: number,
  period: number,
  color: string,
  facts: Partial<CelestialBodyData["science"]>,
): CelestialBodyData => ({
  id,
  name,
  type: "moon",
  radius,
  rotationPeriod: period,
  orbit: { parentId: "saturn", distance, period },
  material: { kind: "ice", color },
  focusDistanceFactor: 6,
  science: { classification: "Natural Satellite", ...facts },
});

const TITAN = saturnMoon("titan", "Titan", 0.52, 13.5, 320, "#d8a45a", {
  radiusKm: 2_574.7,
  gravity: 1.352,
  temperatureK: 94,
  orbitalPeriodDays: 15.945,
});
const ENCELADUS = saturnMoon("enceladus", "Enceladus", 0.16, 11.5, 80, "#f0f5fa", {
  radiusKm: 252.1,
  gravity: 0.113,
  temperatureK: 75,
  orbitalPeriodDays: 1.37,
});

const uranusMoon = (
  id: string,
  name: string,
  radius: number,
  distance: number,
  period: number,
  facts: Partial<CelestialBodyData["science"]>,
): CelestialBodyData => ({
  id,
  name,
  type: "moon",
  radius,
  rotationPeriod: period,
  orbit: { parentId: "uranus", distance, period },
  material: { kind: "ice", color: "#b5bfc8" },
  focusDistanceFactor: 6,
  science: { classification: "Natural Satellite", ...facts },
});

const TITANIA = uranusMoon("titania", "Titania", 0.24, 5.8, 180, {
  radiusKm: 788.4,
  orbitalPeriodDays: 8.706,
});
const OBERON = uranusMoon("oberon", "Oberon", 0.22, 7.4, 260, {
  radiusKm: 761.4,
  orbitalPeriodDays: 13.463,
});

const TRITON: CelestialBodyData = {
  id: "triton",
  name: "Triton",
  type: "moon",
  radius: 0.3,
  rotationPeriod: 220,
  orbit: { parentId: "neptune", distance: 5.6, period: 220, inclination: 23 },
  material: { kind: "ice", color: "#cdd6e0" },
  focusDistanceFactor: 6,
  description: "A retrograde moon of Neptune, likely a captured Kuiper-belt object.",
  science: {
    radiusKm: 1_353.4,
    gravity: 0.779,
    temperatureK: 38,
    orbitalPeriodDays: -5.877,
    classification: "Natural Satellite",
  },
};

export const SOLAR_SYSTEM_BODIES: CelestialBodyData[] = [
  SUN,
  MERCURY,
  VENUS,
  EARTH,
  MOON,
  MARS,
  PHOBOS,
  DEIMOS,
  JUPITER,
  IO,
  EUROPA,
  GANYMEDE,
  CALLISTO,
  SATURN,
  TITAN,
  ENCELADUS,
  URANUS,
  TITANIA,
  OBERON,
  NEPTUNE,
  TRITON,
];
