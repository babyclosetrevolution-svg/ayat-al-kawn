/**
 * Time utilities — Julian Day, GMST, LST.
 *
 * Formulas from Meeus, "Astronomical Algorithms" (low precision is
 * sufficient for a planetarium visualization).
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function julianDay(date: Date): number {
  // Meeus chapter 7.
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    (date.getUTCHours() +
      (date.getUTCMinutes() + date.getUTCSeconds() / 60) / 60) /
      24;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    b -
    1524.5
  );
}

/** Julian centuries from J2000.0. */
export function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

/** Greenwich Mean Sidereal Time, hours. */
export function gmstHours(jd: number): number {
  const t = julianCentury(jd);
  let g =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  g = ((g % 360) + 360) % 360;
  return g / 15;
}

/** Local Sidereal Time, hours. */
export function lstHours(jd: number, longitudeDeg: number): number {
  let h = gmstHours(jd) + longitudeDeg / 15;
  h = ((h % 24) + 24) % 24;
  return h;
}

export function normDeg(x: number): number {
  return ((x % 360) + 360) % 360;
}
