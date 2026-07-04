/**
 * AYAT AL-KAWN — Global engine configuration.
 * Centralizes tunable values so no magic numbers leak into systems.
 */
export const ENGINE_CONFIG = {
  renderer: {
    antialias: true,
    powerPreference: "high-performance" as const,
    dpr: [1, 2] as [number, number],
  },
  camera: {
    // Narrower FOV = subtle lens compression, so the Sun and planets
    // never dominate the frame on landing.
    fov: 42,
    near: 0.01,
    far: 200000,
    // Pulled far back so the opening composition reads as "a small
    // presence inside an enormous volume" rather than a solar-system
    // showcase. The Director will reframe on first user focus.
    position: [0, 320, 940] as [number, number, number],
  },

  controls: {
    enableDamping: true,
    dampingFactor: 0.06,
    rotateSpeed: 0.5,
    zoomSpeed: 0.7,
    minDistance: 0.3,
    maxDistance: 20000,
  },
  starfield: {
    count: 8000,
    radius: 900,
    depth: 600,
    baseSize: 1.1,
  },
} as const;

export const BRAND = {
  title: "AYAT AL-KAWN",
  subtitle: "An Interactive Journey Through the Universe",
} as const;
