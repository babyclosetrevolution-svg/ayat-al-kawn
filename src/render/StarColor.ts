/**
 * temperatureToColors — minimal blackbody approximation used by the
 * generic Star renderer. Returns a (cold, hot, rim) tint triplet keyed
 * to a star's effective temperature. The palette is hand-tuned so any
 * temperature on the H-R diagram lands on a plausible visible color.
 *
 * Used by the rendering layer only; never imported from data files.
 */
export interface StarColorSet {
  cold: string;
  hot: string;
  rim: string;
  light: string;
}

interface Stop {
  t: number;
  cold: [number, number, number];
  hot: [number, number, number];
  rim: [number, number, number];
}

// Stops sorted ascending by temperature. Linear interpolation between.
const STOPS: Stop[] = [
  { t: 2500, cold: [0.80, 0.18, 0.08], hot: [1.00, 0.62, 0.32], rim: [1.00, 0.42, 0.18] },
  { t: 3500, cold: [0.92, 0.32, 0.14], hot: [1.00, 0.72, 0.42], rim: [1.00, 0.55, 0.24] },
  { t: 5000, cold: [1.00, 0.55, 0.20], hot: [1.00, 0.92, 0.72], rim: [1.00, 0.78, 0.42] },
  { t: 5800, cold: [1.00, 0.66, 0.28], hot: [1.00, 0.96, 0.84], rim: [1.00, 0.85, 0.55] },
  { t: 7500, cold: [0.92, 0.92, 1.00], hot: [1.00, 1.00, 1.00], rim: [0.90, 0.94, 1.00] },
  { t: 10000, cold: [0.78, 0.86, 1.00], hot: [0.96, 0.98, 1.00], rim: [0.78, 0.88, 1.00] },
  { t: 20000, cold: [0.62, 0.74, 1.00], hot: [0.88, 0.94, 1.00], rim: [0.60, 0.78, 1.00] },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function toHex(c: [number, number, number]): string {
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(c[0])}${to(c[1])}${to(c[2])}`;
}

export function temperatureToColors(temperatureK: number | undefined): StarColorSet {
  const T = temperatureK ?? 5800;
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (T >= STOPS[i].t && T <= STOPS[i + 1].t) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const f = (T - lo.t) / Math.max(1, hi.t - lo.t);
  const mix = (
    a: [number, number, number],
    b: [number, number, number],
  ): [number, number, number] => [
    lerp(a[0], b[0], f),
    lerp(a[1], b[1], f),
    lerp(a[2], b[2], f),
  ];
  const cold = mix(lo.cold, hi.cold);
  const hot = mix(lo.hot, hi.hot);
  const rim = mix(lo.rim, hi.rim);
  return {
    cold: toHex(cold),
    hot: toHex(hot),
    rim: toHex(rim),
    light: toHex(hot),
  };
}
