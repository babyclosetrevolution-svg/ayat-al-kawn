/**
 * HYG bright-star catalog loader.
 *
 * Reads the compact JSON extracted from the HYG v4.4 database (all real
 * stars with apparent magnitude ≤ 6.5 — i.e. the entire naked-eye sky).
 * Each entry becomes a `SkyStar` with a stable identity, real spectral
 * data and a compressed scene-space position obtained through the
 * project's stellar coordinate helper.
 *
 * This is the SOURCE OF TRUTH for the visible sky. Nothing else in the
 * project may fabricate "background points": every visible light in
 * space must resolve to a `SkyStar` id.
 */
import hygRaw from "./hyg-bright.json";
import { stellarPositionToScene } from "../../sim/coords/stellar";

type Row = [
  number, // i
  number, // h (hip)
  string, // n (proper)
  string, // b (bayer)
  string, // c (constellation)
  number, // r (ra hours)
  number, // d (dec deg)
  number, // p (distance parsecs)
  number, // m (apparent magnitude)
  string, // s (spectral)
  number | null, // ci (B-V)
];

interface CompactCatalog {
  k: string[];
  s: Row[];
}

export interface SkyStar {
  id: string;
  hip: number;
  name: string;
  bayer: string;
  constellation: string;
  raHours: number;
  decDegrees: number;
  parsecs: number;
  /** Apparent visual magnitude. Lower = brighter. */
  mag: number;
  spectralClass: string;
  /** Estimated effective temperature (K) — from B-V when available. */
  temperatureK: number;
  /** Scene-space position (compressed distance). */
  position: [number, number, number];
}

/** Ballpark B-V → effective temperature (Ballesteros 2012). */
function bvToTemperature(bv: number): number {
  const t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  return Math.max(2000, Math.min(45000, t));
}

/** Fallback: spectral class first character → representative temperature. */
function spectralToTemperature(spect: string): number {
  const c = (spect || "").trim().toUpperCase().charAt(0);
  switch (c) {
    case "O": return 35000;
    case "B": return 15000;
    case "A": return 8500;
    case "F": return 6500;
    case "G": return 5600;
    case "K": return 4400;
    case "M": return 3200;
    default:  return 5800;
  }
}

let cache: SkyStar[] | null = null;

export function loadHygCatalog(): SkyStar[] {
  if (cache) return cache;
  const raw = hygRaw as CompactCatalog;
  const rows = raw.s;
  const out: SkyStar[] = new Array(rows.length);
  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const [i, h, n, b, c, ra, dec, p, m, s, ci] = r;
    const temperatureK =
      typeof ci === "number" ? bvToTemperature(ci) : spectralToTemperature(s);
    out[idx] = {
      id: h ? `hip-${h}` : `hyg-${i}`,
      hip: h,
      name: n,
      bayer: b,
      constellation: c,
      raHours: ra,
      decDegrees: dec,
      parsecs: p,
      mag: m,
      spectralClass: s,
      temperatureK,
      position: stellarPositionToScene({
        raHours: ra,
        decDegrees: dec,
        parsecs: p,
      }),
    };
  }
  cache = out;
  return out;
}
