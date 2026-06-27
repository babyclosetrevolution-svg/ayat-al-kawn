import { useEffect, useState } from "react";
import type { CelestialBodyData } from "../types/CelestialBody";
import { CatalogManager } from "../../sim";
import { Galaxy } from "./Galaxy";
import { SolarSystem } from "./SolarSystem";

/**
 * Universe — root of the astronomical scene graph.
 *
 *   Universe → Galaxy → SolarSystem → Star → Planet → Moon
 *
 * Bodies are pulled from the CatalogManager rather than imported
 * directly, so future catalogs (additional systems, exoplanets) plug in
 * without touching this file.
 */
export function Universe() {
  const [bodies, setBodies] = useState<CelestialBodyData[] | null>(
    CatalogManager.get("solar-system") ?? null,
  );

  useEffect(() => {
    if (bodies) return;
    let cancelled = false;
    CatalogManager.load("solar-system").then((b) => {
      if (!cancelled) setBodies(b);
    });
    return () => {
      cancelled = true;
    };
  }, [bodies]);

  if (!bodies) return null;

  return (
    <Galaxy>
      <SolarSystem bodies={bodies} />
    </Galaxy>
  );
}
