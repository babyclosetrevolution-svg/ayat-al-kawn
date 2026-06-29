import { DEG, RAD, lstHours } from "./time";
import type { EquatorialCoord, HorizontalCoord } from "../types";

/**
 * Equatorial → horizontal coordinate transform.
 *
 * Standard spherical conversion using the local sidereal time and the
 * observer's geodetic latitude. Returns altitude (-90..90) and
 * azimuth (0..360, measured from north toward east).
 */
export function equatorialToHorizontal(
  c: EquatorialCoord,
  latitudeDeg: number,
  longitudeDeg: number,
  jd: number,
): HorizontalCoord {
  const lst = lstHours(jd, longitudeDeg);
  // Hour angle (degrees).
  let ha = (lst - c.raHours) * 15;
  ha = ((ha + 180) % 360) - 180;

  const haR = ha * DEG;
  const decR = c.decDegrees * DEG;
  const latR = latitudeDeg * DEG;

  const sinAlt =
    Math.sin(decR) * Math.sin(latR) +
    Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const y = -Math.cos(decR) * Math.cos(latR) * Math.sin(haR);
  const x = Math.sin(decR) - Math.sin(alt) * Math.sin(latR);
  let az = Math.atan2(y, x) * RAD;
  az = ((az % 360) + 360) % 360;

  return { altitudeDegrees: alt * RAD, azimuthDegrees: az };
}

/**
 * Convert horizontal coordinates to a unit vector in scene space.
 *
 * Convention used by ObservatoryScene:
 *   +Y = zenith
 *   +Z = north (azimuth 0)
 *   +X = east  (azimuth 90)
 */
export function horizontalToUnitVector(h: HorizontalCoord): [number, number, number] {
  const alt = h.altitudeDegrees * DEG;
  const az = h.azimuthDegrees * DEG;
  const cosAlt = Math.cos(alt);
  const x = cosAlt * Math.sin(az);
  const y = Math.sin(alt);
  const z = cosAlt * Math.cos(az);
  return [x, y, z];
}
