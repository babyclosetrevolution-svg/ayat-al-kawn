import type { BodyType } from "../../world/types/CelestialBody";

/**
 * Camera presets — declarative framing recipes per body category.
 *
 * Every preset says how far to sit, what FOV to use, how fast to glide, and
 * which vertical offset to apply. The CameraDirector blends from preset to
 * preset; no UI duplicates these constants.
 */
export interface CameraPreset {
  id: string;
  /** Multiplier applied to the body's suggested distance. */
  distanceFactor: number;
  /** Field of view in degrees. */
  fov: number;
  /** Vertical offset as a fraction of distance (above the target). */
  elevation: number;
  /** Side offset as a fraction of distance (orbit reveal). */
  offset: number;
  /** Smoothing rate (higher = snappier). */
  transitionRate: number;
  /** Idle orbit drift, radians per second. */
  idleDrift: number;
  /** Idle vertical breathing amplitude, fraction of distance. */
  breathing: number;
}

const PLANET: CameraPreset = {
  id: "planet",
  distanceFactor: 1,
  fov: 50,
  elevation: 0.22,
  offset: 0.45,
  transitionRate: 1.4,
  idleDrift: 0.012,
  breathing: 0.01,
};

const MOON: CameraPreset = {
  id: "moon",
  distanceFactor: 1.1,
  fov: 46,
  elevation: 0.18,
  offset: 0.35,
  transitionRate: 1.6,
  idleDrift: 0.018,
  breathing: 0.008,
};

const STAR: CameraPreset = {
  id: "star",
  distanceFactor: 1.4,
  fov: 55,
  elevation: 0.12,
  offset: 0.6,
  transitionRate: 1.1,
  idleDrift: 0.006,
  breathing: 0.014,
};

const SOLAR_SYSTEM: CameraPreset = {
  id: "solar-system",
  distanceFactor: 1,
  fov: 60,
  elevation: 0.35,
  offset: 0.4,
  transitionRate: 0.9,
  idleDrift: 0.003,
  breathing: 0.016,
};

const GALAXY: CameraPreset = {
  id: "galaxy",
  distanceFactor: 1,
  fov: 65,
  elevation: 0.55,
  offset: 0.6,
  transitionRate: 0.55,
  idleDrift: 0.002,
  breathing: 0.012,
};

export const CAMERA_PRESETS = {
  planet: PLANET,
  moon: MOON,
  star: STAR,
  solarSystem: SOLAR_SYSTEM,
  galaxy: GALAXY,
} as const;

export type BroadBodyKind = BodyType | "galaxy";

export function pickPreset(type: BroadBodyKind | undefined): CameraPreset {
  switch (type) {
    case "galaxy":
      return GALAXY;
    case "star":
      return STAR;
    case "moon":
      return MOON;
    case "planet":
    case "asteroid":
    case "comet":
    default:
      return PLANET;
  }
}
