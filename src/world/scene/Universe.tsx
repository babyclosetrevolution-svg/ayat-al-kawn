import { useEffect, useState } from "react";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { CatalogManager } from "../../sim";
import { SpatialPartition, StreamingManager } from "../../streaming";
import { PerformanceMetrics } from "../../metrics";
import { Galaxy } from "./Galaxy";
import { Sector } from "./Sector";
import { Region } from "./Region";
import { SolarSystem } from "./SolarSystem";
import { StellarNeighborhood } from "./StellarNeighborhood";

/**
 * Universe — root of the astronomical scene graph.
 *
 *   Universe → Galaxy → Sector → Region → { SolarSystem, StellarNeighborhood, … }
 *
 * Sector/Region are inert wrappers today; they exist so the streaming
 * layer has matching scene-graph nodes when partitioning grows beyond a
 * single solar system. Catalog mounts also register their bounding
 * regions with SpatialPartition + StreamingManager so the engine starts
 * collecting streaming telemetry immediately, with no visible change.
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

  // Register default partition nodes once.
  useEffect(() => {
    SpatialPartition.insert({
      id: "milky-way",
      level: "sector",
      center: new THREE.Vector3(0, 0, 0),
      radius: 1e6,
      parentId: "universe",
    });
    SpatialPartition.insert({
      id: "local-bubble",
      level: "region",
      center: new THREE.Vector3(0, 0, 0),
      radius: 5e3,
      parentId: "milky-way",
    });
    const solar = SpatialPartition.insert({
      id: "sol-system",
      level: "local-system",
      center: new THREE.Vector3(0, 0, 0),
      radius: 400,
      parentId: "local-bubble",
    });
    const neighborhood = SpatialPartition.insert({
      id: "stellar-neighborhood",
      level: "local-system",
      center: new THREE.Vector3(0, 0, 0),
      radius: 5e3,
      parentId: "local-bubble",
    });
    StreamingManager.registerRegion(solar);
    StreamingManager.registerRegion(neighborhood);
  }, []);

  // Reflect catalog load count into metrics overlay.
  useEffect(() => {
    const update = () =>
      PerformanceMetrics.patch({ loadedCatalogs: CatalogManager.loadedCount() });
    update();
    return CatalogManager.subscribe(update);
  }, []);

  return (
    <Galaxy>
      <Sector>
        <Region>
          {bodies && <SolarSystem bodies={bodies} />}
          {stars && <StellarNeighborhood stars={stars} />}
        </Region>
      </Sector>
    </Galaxy>
  );
}
