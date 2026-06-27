import type { CelestialBodyData } from "../../world/types/CelestialBody";

/**
 * Solar-system body registry — Phase 3.
 *
 * Only the three Phase-2 bodies are declared. The renderer reads this list
 * verbatim; new planets and moons are added here, not in TSX.
 */
const TEX = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets";

export const SOLAR_SYSTEM_BODIES: CelestialBodyData[] = [
  {
    id: "sun",
    name: "Sun",
    type: "star",
    radius: 6,
    rotationPeriod: 314,
    position: [-180, 30, -120],
    emissive: {
      color: "#ffd089",
      intensity: 1,
      lightColor: "#fff1d0",
      lightIntensity: 4.5,
      halos: [
        { color: "#ffc869", opacity: 0.18, scale: 1.08 },
        { color: "#ff9a3c", opacity: 0.07, scale: 1.35 },
      ],
    },
    focusDistanceFactor: 4,
    description: "G-type main-sequence star at the heart of the Solar System.",
  },
  {
    id: "earth",
    name: "Earth",
    type: "planet",
    radius: 2,
    rotationPeriod: 157,
    axialTilt: 23.4,
    position: [0, 0, 0],
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
    description: "Third planet from the Sun and the only known world with life.",
  },
  {
    id: "moon",
    name: "Moon",
    type: "moon",
    radius: 0.55,
    rotationPeriod: 105,
    orbit: { parentId: "earth", distance: 7, period: 105 },
    textures: { map: `${TEX}/moon_1024.jpg` },
    material: { kind: "rock", roughness: 1, metalness: 0 },
    focusDistanceFactor: 6,
    description: "Earth's only natural satellite, tidally locked to its primary.",
  },
];
