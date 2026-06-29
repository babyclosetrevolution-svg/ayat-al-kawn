import { DEG, RAD, normDeg } from "./time";
import type { EquatorialCoord } from "../types";

/** Mean obliquity of the ecliptic, degrees. */
export function obliquityDeg(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  return 23.4392911 - 0.0130042 * t - 1.64e-7 * t * t;
}

/** Convert ecliptic (λ, β) to equatorial (RA, Dec). */
export function eclipticToEquatorial(
  lambdaDeg: number,
  betaDeg: number,
  jd: number,
): EquatorialCoord {
  const eps = obliquityDeg(jd) * DEG;
  const l = lambdaDeg * DEG;
  const b = betaDeg * DEG;
  const sinDec = Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l);
  const dec = Math.asin(sinDec);
  const y = Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps);
  const x = Math.cos(l);
  let ra = Math.atan2(y, x) * RAD;
  ra = normDeg(ra);
  return { raHours: ra / 15, decDegrees: dec * RAD };
}

/**
 * Low-precision Sun position (Meeus chapter 25).
 * Returns geocentric ecliptic longitude λ (deg) and apparent equatorial
 * coordinates.
 */
export function sunPosition(jd: number): {
  lambdaDeg: number;
  equatorial: EquatorialCoord;
  distanceAU: number;
} {
  const t = (jd - 2451545.0) / 36525;
  const L0 = normDeg(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
  const M = normDeg(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
  const Mr = M * DEG;
  const C =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(Mr) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * t;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG);
  const e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;
  const v = M + C;
  const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(v * DEG));
  return {
    lambdaDeg: lambda,
    equatorial: eclipticToEquatorial(lambda, 0, jd),
    distanceAU: R,
  };
}
