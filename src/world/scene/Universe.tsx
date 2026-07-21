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
import { ScaleGroup } from "../../sim/scale";
import type { DeepSkyBodyData } from "../../data/deep-sky";

/**
 * Universe — racine du scene-graph astronomique.
 *
 *   Universe → Galaxy → Sector → Region → { SolarSystem, StellarNeighborhood, ... }
 *
 * Phase 23 : toutes les couches sont désormais gouvernées par l'unique
 * `UniverseScaleEngine` via `ScaleGroup`. Aucun composant enfant ne
 * décide seul de sa visibilité. Ajouter une nouvelle couche visuelle
 * = l'envelopper dans `<ScaleGroup layer="…">`, jamais un test ad-hoc.
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

  useEffect(() => {
    const update = () =>
      PerformanceMetrics.patch({ loadedCatalogs: CatalogManager.loadedCount() });
    update();
    return CatalogManager.subscribe(update);
  }, []);

  return (
    <Galaxy>
      <ScaleGroup layer="milkyWay">
        <MilkyWayScene />
      </ScaleGroup>
      <Sector>
        <Region>
          {bodies && (
            <ScaleGroup layer="solarBodies">
              <SolarSystem bodies={bodies} />
            </ScaleGroup>
          )}
          {stars && (
            <ScaleGroup layer="stellarNeighborhood">
              <StellarNeighborhood stars={stars} />
            </ScaleGroup>
          )}
          {deepSky && (
            <ScaleGroup layer="deepSky">
              <DeepSkyScene items={deepSky} />
            </ScaleGroup>
          )}
        </Region>
      </Sector>
    </Galaxy>
  );
}
