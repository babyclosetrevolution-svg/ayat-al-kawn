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
    // Narrow FOV = lens compression. Combined with an off-axis
    // position, the Sun never sits centered on landing; it's just a
    // bright point encountered inside a much larger volume.
    fov: 40,
    near: 0.01,
    far: 200000,
    // Off-center, well pulled back. The Observer is a small presence
    // adrift in space — the Solar System is somewhere over there, not
    // the subject of the frame.
    position: [-1450, 340, 2150] as [number, number, number],
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
