import type { CelestialBodyData } from "../../world/types/CelestialBody";
import type { ComparisonKind, ComparisonMetric } from "../types";

/**
 * Metric extractors — read a normalized numeric value + display string
 * from a body's `science` block. Stays decoupled from rendering and never
 * mutates source data.
 */

const SUN_RADIUS_KM = 695_700;
const EARTH_RADIUS_KM = 6_371;

export function metricFor(
  body: CelestialBodyData,
  kind: ComparisonKind,
): ComparisonMetric {
  const s = body.science ?? {};
  switch (kind) {
    case "diameter":
    case "radius": {
      const km = s.radiusKm ?? (s.radiusSuns ? s.radiusSuns * SUN_RADIUS_KM : 0);
      const factor = kind === "diameter" ? 2 : 1;
      const v = km * factor;
      if (!v) return missing("km");
      return {
        value: v,
        unit: "km",
        display:
          v >= 1_000_000
            ? `${(v / 1_000_000).toFixed(2)} M km`
            : `${formatInt(v)} km`,
      };
    }
    case "mass": {
      const earths = s.massEarths ?? (s.massSuns ? s.massSuns * 333_000 : 0);
      if (!earths) return missing("M⊕");
      return {
        value: earths,
        unit: "M⊕",
        display:
          earths >= 1000
            ? `${(earths / 333_000).toFixed(2)} M☉`
            : `${earths.toFixed(earths < 1 ? 3 : 2)} M⊕`,
      };
    }
    case "gravity":
      if (!s.gravity) return missing("m/s²");
      return { value: s.gravity, unit: "m/s²", display: `${s.gravity.toFixed(2)} m/s²` };
    case "temperature": {
      const k = s.temperatureK ?? s.effectiveTemperatureK ?? 0;
      if (!k) return missing("K");
      return { value: k, unit: "K", display: `${formatInt(k)} K` };
    }
    case "distance": {
      const au = s.semiMajorAxisAU;
      const ly = s.distanceLightYears;
      if (ly) return { value: ly * 63_241, unit: "AU", display: `${ly.toFixed(2)} ly` };
      if (au) return { value: au, unit: "AU", display: `${au.toFixed(3)} AU` };
      return missing("AU");
    }
    case "rotation": {
      const h = s.rotationPeriodHours;
      if (h === undefined) return missing("h");
      const abs = Math.abs(h);
      const sign = h < 0 ? " (retrograde)" : "";
      if (abs >= 48) return { value: abs, unit: "h", display: `${(abs / 24).toFixed(2)} days${sign}` };
      return { value: abs, unit: "h", display: `${abs.toFixed(2)} h${sign}` };
    }
    case "orbit": {
      const d = s.orbitalPeriodDays;
      if (!d) return missing("days");
      const abs = Math.abs(d);
      if (abs >= 365 * 2) return { value: abs, unit: "days", display: `${(abs / 365.25).toFixed(2)} years` };
      return { value: abs, unit: "days", display: `${abs.toFixed(2)} days` };
    }
  }
}

function missing(unit: string): ComparisonMetric {
  return { value: 0, unit, display: "—", missing: true };
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export const COMPARISON_LABELS: Record<ComparisonKind, string> = {
  diameter: "Diameter",
  radius: "Radius",
  mass: "Mass",
  gravity: "Gravity",
  temperature: "Temperature",
  distance: "Distance from primary",
  rotation: "Rotation period",
  orbit: "Orbital period",
};

export { EARTH_RADIUS_KM, SUN_RADIUS_KM };
