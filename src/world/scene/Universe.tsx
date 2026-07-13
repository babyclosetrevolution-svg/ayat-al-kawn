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
import { MilkyWayScene } from "./MilkyWayScene";
import { DeepSkyScene } from "./DeepSkyScene";
import { CosmicLayer } from "./CosmicLayer";
import type { DeepSkyBodyData } from "../../data/deep-sky";

/**
 * Cosmic layer distance rules (pivot distance from origin, scene units).
 *
 * Phase 23.1 — Restore the cosmic journey. Every layer stays visible at
 * every distance; progression is felt through real spatial distance, not
 * through opacity gates. The `far` values are pushed well beyond the
 * navigable volume so `CosmicLayer` only trims the extreme fringes
 * (e.g. galaxies fading in from truly intergalactic distances) rather
 * than hiding the Solar System or the Milky Way at the opening.
 */
const LAYER_RANGES = {
  solar: { near: 0, far: 80000 },
  stars: { near: 0, far: 80000 },
  deepSky: { near: 0, far: 120000 },
  milkyWay: { near: 0, far: 120000 },
} as const;

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
  const [deepSky, setDeepSky] = useState<DeepSkyBodyData[] | null>(
    CatalogManager.get("deep-sky") ?? null,
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
    if (!deepSky) {
      CatalogManager.load("deep-sky").then((b) => {
        if (!cancelled) setDeepSky(b);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [bodies, stars, deepSky]);

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
      <CosmicLayer near={LAYER_RANGES.milkyWay.near} far={LAYER_RANGES.milkyWay.far}>
        <MilkyWayScene />
      </CosmicLayer>
      <Sector>
        <Region>
          {bodies && (
            <CosmicLayer near={LAYER_RANGES.solar.near} far={LAYER_RANGES.solar.far}>
              <SolarSystem bodies={bodies} />
            </CosmicLayer>
          )}
          {stars && (
            <CosmicLayer near={LAYER_RANGES.stars.near} far={LAYER_RANGES.stars.far}>
              <StellarNeighborhood stars={stars} />
            </CosmicLayer>
          )}
          {deepSky && (
            <CosmicLayer near={LAYER_RANGES.deepSky.near} far={LAYER_RANGES.deepSky.far}>
              <DeepSkyScene items={deepSky} />
            </CosmicLayer>
          )}
        </Region>
      </Sector>
    </Galaxy>
  );
}
