/**
 * Observatory — shared types.
 *
 * The observatory layer is a self-contained planetarium view: a
 * geocentric celestial sphere centered on the user's location at a
 * chosen instant. It computes everything client-side from compact
 * Meeus-style ephemerides; no external service.
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  /** Display label (city, country, …). */
  label?: string;
}

export interface EquatorialCoord {
  /** Right ascension, hours. */
  raHours: number;
  /** Declination, degrees. */
  decDegrees: number;
}

export interface HorizontalCoord {
  /** Altitude above the horizon, degrees (-90..90). */
  altitudeDegrees: number;
  /** Azimuth from north, eastward, degrees (0..360). */
  azimuthDegrees: number;
}

export interface CelestialBodyEphemeris {
  id: string;
  name: string;
  equatorial: EquatorialCoord;
  horizontal: HorizontalCoord;
  /** Apparent magnitude (smaller = brighter). */
  magnitude?: number;
  /** Display color (hex). */
  color?: string;
}

export interface MoonInfo {
  phase: number; // 0..1, 0 = new, 0.5 = full
  illuminatedFraction: number; // 0..1
  phaseName: string;
  ageDays: number;
}

export interface DayLightInfo {
  sunrise: Date | null;
  sunset: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  nauticalDawn: Date | null;
  nauticalDusk: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
  solarNoon: Date | null;
}

export type AppMode = "universe" | "observatory";
