import { useEffect, useState } from "react";
import type { CelestialBodyData } from "../types/CelestialBody";
import { CatalogManager } from "../../sim";
import { Galaxy } from "./Galaxy";
import { SolarSystem } from "./SolarSystem";
import { StellarNeighborhood } from "./StellarNeighborhood";

/**
 * Universe — root of the astronomical scene graph.
 *
 *   Universe → Galaxy → { SolarSystem, StellarNeighborhood, … }
 *
 * Each child catalog mounts independently; the engine never assumes a
 * single "world" so future catalogs (exoplanetary systems, deep-sky
 * objects) plug in alongside without touching this file.
 */
export function Universe() {
  const [bodies, setBodies] = useState<CelestialBodyData[] | null>(
    CatalogManager.get("solar-system") ?? null,
  );
  const [stars, setStars] = useState<CelestialBodyData[] | null>(
    CatalogManager.get("stars") ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    if (!bodies) {
      CatalogManager.load("solar-system").then((b) => {
        if (!cancelled) setBodies(b);
      });
    }
    if (!stars) {
      CatalogManager.load("stars").then((b) => {
        if (!cancelled) setStars(b);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [bodies, stars]);

  return (
    <Galaxy>
      {bodies && <SolarSystem bodies={bodies} />}
      {stars && <StellarNeighborhood stars={stars} />}
    </Galaxy>
  );
}
