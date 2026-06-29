import { DEG, RAD, normDeg } from "./time";
import { eclipticToEquatorial } from "./sun";
import type { EquatorialCoord } from "../types";

/**
 * Approximate planetary positions — Schlyter / Paul Schlyter "Computing
 * planetary positions" (sufficient for naked-eye visualization).
 *
 * Each element is given at epoch and a per-day rate. We solve Kepler
 * iteratively and project into heliocentric ecliptic coordinates, then
 * subtract Earth's heliocentric vector to get geocentric ecliptic
 * coordinates, then convert to equatorial.
 */

interface OrbitalElements {
  N: [number, number]; // longitude of ascending node (deg, deg/day)
  i: [number, number]; // inclination (deg)
  w: [number, number]; // argument of perihelion (deg)
  a: number; // semi-major axis (AU)
  e: [number, number]; // eccentricity
  M: [number, number]; // mean anomaly (deg)
}

interface PlanetSeed {
  id: string;
  name: string;
  color: string;
  magnitude: number;
  elements: OrbitalElements;
}

// Reference epoch: J2000.0 (JD 2451545.0). Day count d = jd - 2451545.0.
// Source: P. Schlyter, https://stjarnhimlen.se/comp/ppcomp.html
const PLANET_SEEDS: PlanetSeed[] = [
  {
    id: "mercury", name: "Mercury", color: "#c9b790", magnitude: 0,
    elements: {
      N: [48.3313, 3.24587e-5], i: [7.0047, 5.0e-8],
      w: [29.1241, 1.01444e-5], a: 0.387098,
      e: [0.205635, 5.59e-10], M: [168.6562, 4.0923344368],
    },
  },
  {
    id: "venus", name: "Venus", color: "#f0d8a8", magnitude: -4,
    elements: {
      N: [76.6799, 2.4659e-5], i: [3.3946, 2.75e-8],
      w: [54.891, 1.38374e-5], a: 0.72333,
      e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244],
    },
  },
  {
    id: "mars", name: "Mars", color: "#d27a55", magnitude: 0.7,
    elements: {
      N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8],
      w: [286.5016, 2.92961e-5], a: 1.523688,
      e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766],
    },
  },
  {
    id: "jupiter", name: "Jupiter", color: "#d9b58c", magnitude: -2,
    elements: {
      N: [100.4542, 2.76854e-5], i: [1.3030, -1.557e-7],
      w: [273.8777, 1.64505e-5], a: 5.20256,
      e: [0.048498, 4.469e-9], M: [19.895, 0.0830853001],
    },
  },
  {
    id: "saturn", name: "Saturn", color: "#e3c98a", magnitude: 0.5,
    elements: {
      N: [113.6634, 2.3898e-5], i: [2.4886, -1.081e-7],
      w: [339.3939, 2.97661e-5], a: 9.55475,
      e: [0.055546, -9.499e-9], M: [316.967, 0.0334442282],
    },
  },
  {
    id: "uranus", name: "Uranus", color: "#a7d8e0", magnitude: 5.5,
    elements: {
      N: [74.0005, 1.3978e-5], i: [0.7733, 1.9e-8],
      w: [96.6612, 3.0565e-5], a: 19.18171,
      e: [0.047318, 7.45e-9], M: [142.5905, 0.011725806],
    },
  },
  {
    id: "neptune", name: "Neptune", color: "#7aa6e0", magnitude: 7.8,
    elements: {
      N: [131.7806, 3.0173e-5], i: [1.77, -2.55e-7],
      w: [272.8461, -6.027e-6], a: 30.05826,
      e: [0.008606, 2.15e-9], M: [260.2471, 0.005995147],
    },
  },
];

interface HelioCoord { x: number; y: number; z: number; }

function evalElements(e: OrbitalElements, d: number) {
  return {
    N: normDeg(e.N[0] + e.N[1] * d),
    i: e.i[0] + e.i[1] * d,
    w: normDeg(e.w[0] + e.w[1] * d),
    a: e.a,
    e: e.e[0] + e.e[1] * d,
    M: normDeg(e.M[0] + e.M[1] * d),
  };
}

function solveKepler(Mdeg: number, e: number): number {
  let E = Mdeg + (e * RAD) * Math.sin(Mdeg * DEG) * (1 + e * Math.cos(Mdeg * DEG));
  for (let iter = 0; iter < 6; iter++) {
    const Er = E * DEG;
    const dE = (E - (e * RAD) * Math.sin(Er) - Mdeg) / (1 - e * Math.cos(Er));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}

function helioPosition(el: OrbitalElements, d: number): HelioCoord {
  const ev = evalElements(el, d);
  const E = solveKepler(ev.M, ev.e);
  const Er = E * DEG;
  const xv = ev.a * (Math.cos(Er) - ev.e);
  const yv = ev.a * Math.sqrt(1 - ev.e * ev.e) * Math.sin(Er);
  const v = Math.atan2(yv, xv) * RAD;
  const r = Math.hypot(xv, yv);
  const Nr = ev.N * DEG, ir = ev.i * DEG;
  const vw = (v + ev.w) * DEG;
  const x = r * (Math.cos(Nr) * Math.cos(vw) - Math.sin(Nr) * Math.sin(vw) * Math.cos(ir));
  const y = r * (Math.sin(Nr) * Math.cos(vw) + Math.cos(Nr) * Math.sin(vw) * Math.cos(ir));
  const z = r * Math.sin(vw) * Math.sin(ir);
  return { x, y, z };
}

// Earth's heliocentric ecliptic position (from Sun): negate Schlyter's
// "Sun" position which is geocentric-ecliptic of the Sun.
function earthHelio(d: number): HelioCoord {
  const w = 282.9404 + 4.70935e-5 * d;
  const a = 1.0;
  const e = 0.016709 - 1.151e-9 * d;
  const M = normDeg(356.047 + 0.9856002585 * d);
  const E = solveKepler(M, e);
  const Er = E * DEG;
  const xv = Math.cos(Er) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(Er);
  const v = Math.atan2(yv, xv) * RAD;
  const r = Math.hypot(xv, yv);
  const lon = (v + w) * DEG;
  // Heliocentric ecliptic = sun→earth vector (Earth's position).
  return { x: r * Math.cos(lon), y: r * Math.sin(lon), z: 0 };
}

export interface PlanetEphemeris {
  id: string;
  name: string;
  color: string;
  magnitude: number;
  equatorial: EquatorialCoord;
  distanceAU: number;
}

export function planetPositions(jd: number): PlanetEphemeris[] {
  const d = jd - 2451545.0;
  const earth = earthHelio(d);
  const out: PlanetEphemeris[] = [];
  for (const p of PLANET_SEEDS) {
    const h = helioPosition(p.elements, d);
    // Geocentric ecliptic vector
    const gx = h.x - earth.x;
    const gy = h.y - earth.y;
    const gz = h.z - earth.z;
    const dist = Math.hypot(gx, gy, gz);
    const lambda = normDeg(Math.atan2(gy, gx) * RAD);
    const beta = Math.atan2(gz, Math.hypot(gx, gy)) * RAD;
    out.push({
      id: p.id,
      name: p.name,
      color: p.color,
      magnitude: p.magnitude,
      equatorial: eclipticToEquatorial(lambda, beta, jd),
      distanceAU: dist,
    });
  }
  return out;
}
