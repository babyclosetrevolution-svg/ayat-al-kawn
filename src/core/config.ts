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
    fov: 55,
    near: 0.01,
    far: 100000,
    position: [0, 2, 10] as [number, number, number],
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.06,
    rotateSpeed: 0.5,
    zoomSpeed: 0.6,
    minDistance: 1,
    maxDistance: 5000,
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
