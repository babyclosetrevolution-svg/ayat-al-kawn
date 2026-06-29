import { DEG, RAD } from "./time";
import { equatorialToHorizontal } from "./coords";
import { sunPosition } from "./sun";
import type { DayLightInfo } from "../types";

/**
 * Sun rise/set & twilight times.
 *
 * Brute-force minute-grain search over the local day. Works across any
 * latitude (returns null when the Sun stays above or below the relevant
 * altitude threshold for the whole day — polar regions).
 */
const ALTITUDES = {
  sunrise: -0.833,
  civil: -6,
  nautical: -12,
  astronomical: -18,
} as const;

// Imported lazily inside computation to avoid a cycle.
function sunAltitude(jd: number, latitude: number, longitude: number): number {
  const { equatorial } = sunPosition(jd);
  return equatorialToHorizontal(equatorial, latitude, longitude, jd).altitudeDegrees;
}

function jdFromDate(d: Date): number {
  // Reuse julianDay without circular import: inline minimal version.
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + 1;
  const day =
    d.getUTCDate() +
    (d.getUTCHours() + (d.getUTCMinutes() + d.getUTCSeconds() / 60) / 60) / 24;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

function dateFromJd(jd: number): Date {
  // Inverse — accurate to seconds; sufficient for display.
  const ms = (jd - 2440587.5) * 86400000;
  return new Date(ms);
}

interface CrossingOpts { rising: boolean; threshold: number; }

function findCrossing(
  dayStartUTC: Date,
  latitude: number,
  longitude: number,
  opts: CrossingOpts,
): Date | null {
  const stepMin = 5;
  const minutesInDay = 24 * 60;
  let prevAlt = sunAltitude(jdFromDate(dayStartUTC), latitude, longitude);
  for (let m = stepMin; m <= minutesInDay; m += stepMin) {
    const t = new Date(dayStartUTC.getTime() + m * 60_000);
    const alt = sunAltitude(jdFromDate(t), latitude, longitude);
    const above = alt > opts.threshold;
    const prevAbove = prevAlt > opts.threshold;
    if (above !== prevAbove && above === opts.rising) {
      // Refine with linear interpolation between the two minutes.
      const tPrev = new Date(t.getTime() - stepMin * 60_000);
      const ratio = (opts.threshold - prevAlt) / (alt - prevAlt);
      const ms = tPrev.getTime() + ratio * (t.getTime() - tPrev.getTime());
      return new Date(ms);
    }
    prevAlt = alt;
  }
  return null;
}

function findSolarNoon(dayStartUTC: Date, latitude: number, longitude: number): Date | null {
  let bestT: Date | null = null;
  let bestAlt = -Infinity;
  for (let m = 0; m <= 24 * 60; m += 15) {
    const t = new Date(dayStartUTC.getTime() + m * 60_000);
    const alt = sunAltitude(jdFromDate(t), latitude, longitude);
    if (alt > bestAlt) { bestAlt = alt; bestT = t; }
  }
  return bestAlt > -90 ? bestT : null;
}

/**
 * Daylight info for the local civil day containing `date`.
 *
 * Internally works in UTC; results are JS Date instances that callers
 * can format with their preferred locale / timeZone.
 */
export function daylightInfo(
  date: Date,
  latitude: number,
  longitude: number,
): DayLightInfo {
  // Day window: local midnight of `date` ± 24h in UTC. Since the JS Date
  // already encodes the user's local time, derive midnight from the
  // local calendar fields.
  const localMidnight = new Date(date);
  localMidnight.setHours(0, 0, 0, 0);
  const dayStartUTC = localMidnight;

  return {
    sunrise: findCrossing(dayStartUTC, latitude, longitude, { rising: true, threshold: ALTITUDES.sunrise }),
    sunset: findCrossing(dayStartUTC, latitude, longitude, { rising: false, threshold: ALTITUDES.sunrise }),
    civilDawn: findCrossing(dayStartUTC, latitude, longitude, { rising: true, threshold: ALTITUDES.civil }),
    civilDusk: findCrossing(dayStartUTC, latitude, longitude, { rising: false, threshold: ALTITUDES.civil }),
    nauticalDawn: findCrossing(dayStartUTC, latitude, longitude, { rising: true, threshold: ALTITUDES.nautical }),
    nauticalDusk: findCrossing(dayStartUTC, latitude, longitude, { rising: false, threshold: ALTITUDES.nautical }),
    astronomicalDawn: findCrossing(dayStartUTC, latitude, longitude, { rising: true, threshold: ALTITUDES.astronomical }),
    astronomicalDusk: findCrossing(dayStartUTC, latitude, longitude, { rising: false, threshold: ALTITUDES.astronomical }),
    solarNoon: findSolarNoon(dayStartUTC, latitude, longitude),
  };
}
