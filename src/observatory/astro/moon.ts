import { DEG, RAD, normDeg } from "./time";
import { eclipticToEquatorial, sunPosition } from "./sun";
import type { EquatorialCoord, MoonInfo } from "../types";

/**
 * Low-precision Moon position and phase (Meeus chapter 47, abridged).
 * Accurate enough for a planetarium view.
 */
export function moonPosition(jd: number): {
  lambdaDeg: number;
  betaDeg: number;
  equatorial: EquatorialCoord;
  distanceKm: number;
} {
  const t = (jd - 2451545.0) / 36525;
  const Lp = normDeg(218.3164477 + 481267.88123421 * t);
  const D = normDeg(297.8501921 + 445267.1114034 * t);
  const M = normDeg(357.5291092 + 35999.0502909 * t);
  const Mp = normDeg(134.9633964 + 477198.8675055 * t);
  const F = normDeg(93.272095 + 483202.0175233 * t);

  const Dr = D * DEG, Mr = M * DEG, Mpr = Mp * DEG, Fr = F * DEG;
  // Largest terms only.
  const dL =
    6.288774 * Math.sin(Mpr) +
    1.274027 * Math.sin(2 * Dr - Mpr) +
    0.658314 * Math.sin(2 * Dr) +
    0.213618 * Math.sin(2 * Mpr) -
    0.185116 * Math.sin(Mr) -
    0.114332 * Math.sin(2 * Fr);
  const dB =
    5.128122 * Math.sin(Fr) +
    0.280602 * Math.sin(Mpr + Fr) +
    0.277693 * Math.sin(Mpr - Fr);
  const dist =
    385000.56 -
    20905.355 * Math.cos(Mpr) -
    3699.111 * Math.cos(2 * Dr - Mpr) -
    2955.968 * Math.cos(2 * Dr);

  const lambda = normDeg(Lp + dL);
  const beta = dB;
  return {
    lambdaDeg: lambda,
    betaDeg: beta,
    equatorial: eclipticToEquatorial(lambda, beta, jd),
    distanceKm: dist,
  };
}

const PHASE_NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

export function moonInfo(jd: number): MoonInfo {
  const sun = sunPosition(jd);
  const moon = moonPosition(jd);
  // Phase angle elongation (Moon - Sun ecliptic longitude).
  const phaseAngle = normDeg(moon.lambdaDeg - sun.lambdaDeg);
  const phase = phaseAngle / 360; // 0..1
  // Illuminated fraction (Meeus 48.1).
  const i = (180 - phaseAngle + 360) % 360;
  const iR = i * DEG;
  const k = (1 + Math.cos(iR)) / 2;

  const idx = Math.floor((phase + 1 / 16) * 8) % 8;
  const ageDays = (phase * 29.530588);
  return {
    phase,
    illuminatedFraction: k,
    phaseName: PHASE_NAMES[idx],
    ageDays,
  };
}
