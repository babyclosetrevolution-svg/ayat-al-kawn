import type { CelestialBodyData, BodyType } from "../../world/types/CelestialBody";

/**
 * Deep Sky — extension of the canonical CelestialBodyData contract.
 *
 * No new schema is required: deep-sky objects are CelestialBodyData
 * records whose `type` matches one of the deep-sky variants. Extra,
 * non-rendering metadata lives under `deepSky` (parsed by the
 * Knowledge / Discovery / Comparison engines, ignored by the renderer).
 */
export type DeepSkyKind =
  | "galaxy"
  | "nebula"
  | "star-cluster"
  | "globular-cluster"
  | "open-cluster"
  | "supernova-remnant";

export interface DeepSkyCoordinates {
  /** Right Ascension in hours. */
  raHours: number;
  /** Declination in degrees. */
  decDegrees: number;
  /** Distance from Earth, parsecs. */
  parsecs: number;
}

export interface DeepSkyExtras {
  kind: DeepSkyKind;
  catalogNumber?: string;
  constellation?: string;
  apparentMagnitude?: number;
  distanceLightYears?: number;
  /** Real diameter, light-years. */
  diameterLightYears?: number;
  /** Free-form discovery / cultural notes. */
  discovery?: string;
  /** Image URL placeholders for a future gallery module. */
  gallery?: string[];
  /** Reference placeholders surfaced in the Knowledge panel. */
  references?: { title: string; url?: string }[];
}

export interface DeepSkyBodyData extends CelestialBodyData {
  type: Exclude<BodyType, "star" | "planet" | "moon" | "asteroid" | "comet">;
  deepSky: DeepSkyExtras;
}
