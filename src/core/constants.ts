/**
 * Constants — centralised astronomical & physical constants (SI).
 *
 * Rendering layers never embed these directly; data files in
 * `src/data/**` reference them so the same value is never duplicated.
 *
 * Sources: IAU 2015 nominal values where applicable.
 */
import { AU, EARTH_MASS, SOLAR_MASS } from "./units";

// ── Universal ────────────────────────────────────────────────────────────
/** Newtonian constant of gravitation, m³·kg⁻¹·s⁻². */
export const G = 6.674_30e-11;
/** Speed of light in vacuum, m/s. */
export const C = 299_792_458;
/** Astronomical unit, meters. (Re-exported for convenience.) */
export const ASTRONOMICAL_UNIT = AU;

// ── Sun ──────────────────────────────────────────────────────────────────
export const SUN = {
  radiusMeters: 6.957e8,
  massKg: SOLAR_MASS,
  luminosityWatts: 3.828e26,
  /** Surface effective temperature, K. */
  temperatureK: 5_772,
} as const;

// ── Earth ────────────────────────────────────────────────────────────────
export const EARTH = {
  /** Equatorial radius, meters. */
  radiusMeters: 6.378_137e6,
  massKg: EARTH_MASS,
  /** Sidereal rotation period, seconds (~23h 56m 4s). */
  rotationPeriodSeconds: 86_164.0905,
  /** Mean orbital radius (1 AU). */
  orbitalRadiusMeters: AU,
  /** Sidereal orbital period, seconds. */
  orbitalPeriodSeconds: 365.256_363_004 * 86_400,
  axialTiltDegrees: 23.4392811,
} as const;

// ── Moon ─────────────────────────────────────────────────────────────────
export const MOON = {
  radiusMeters: 1.737_4e6,
  massKg: 7.342e22,
  /** Mean distance from Earth, meters. */
  orbitalRadiusMeters: 3.844e8,
  /** Sidereal orbital period, seconds (~27.32 days). */
  orbitalPeriodSeconds: 27.321_661 * 86_400,
  orbitalInclinationDegrees: 5.145,
} as const;
