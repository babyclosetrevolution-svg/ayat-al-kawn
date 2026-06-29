import type { CelestialBodyData } from "../../world/types/CelestialBody";
import { SOLAR_SYSTEM_BODIES } from "../../data/solar-system/bodies";
import { STELLAR_NEIGHBORHOOD } from "../../data/stars/catalog";
import { DEEP_SKY_CATALOG } from "../../data/deep-sky";

/**
 * BodyIndex — unified lookup over every renderable body shipped by the
 * data layer. Lives in `src/scale/` so the comparison engine can pull
 * scientific facts without re-importing data fixtures everywhere.
 */
const INDEX = new Map<string, CelestialBodyData>();
for (const b of SOLAR_SYSTEM_BODIES) INDEX.set(b.id, b);
for (const b of STELLAR_NEIGHBORHOOD) INDEX.set(b.id, b);
for (const b of DEEP_SKY_CATALOG) INDEX.set(b.id, b);

export function getBody(id: string | null | undefined): CelestialBodyData | undefined {
  if (!id) return undefined;
  return INDEX.get(id);
}

export function allBodies(): CelestialBodyData[] {
  return Array.from(INDEX.values());
}

/** True when at least one comparable scientific fact is available. */
export function isComparable(id: string): boolean {
  const b = INDEX.get(id);
  if (!b) return false;
  const s = b.science;
  if (!s) return false;
  return Boolean(
    s.radiusKm ||
      s.massEarths ||
      s.massSuns ||
      s.gravity ||
      s.temperatureK ||
      s.effectiveTemperatureK ||
      s.semiMajorAxisAU ||
      s.distanceLightYears ||
      s.rotationPeriodHours ||
      s.orbitalPeriodDays ||
      s.radiusSuns,
  );
}
