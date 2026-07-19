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
    far: 200000,
    // Camera starts on the surface of the home Earth (single reference
    // frame). Leaving the ground is a continuous flight — no scene swap.
    // Y = EARTH_RADIUS (380) + eye height (0.12). Z = HOME_EARTH.z.
    position: [0, 380.12, 4200] as [number, number, number],
  },
  // The home Earth — a single, always-mounted surface layer that lets
  // the Observer glide continuously from ground into deep space. Its
  // atmosphere and lights fade smoothly with altitude; the celestial
  // sky-shell rides with it. Placed well outside the Solar System so
  // the Sun reads as a distant bright point on landing.
  homeEarth: {
    position: [0, 0, 4200] as [number, number, number],
    radius: 380,
    eyeHeight: 0.12,
  },

  controls: {
    enableDamping: true,
    dampingFactor: 0.06,
    rotateSpeed: 0.5,
    zoomSpeed: 0.7,
    minDistance: 0.3,
    maxDistance: 60000,
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
