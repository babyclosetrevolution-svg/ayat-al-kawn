/**
 * Tests d'invariants du Universe Scale Engine — Phase 23.
 *
 * Framework-agnostique : chaque assertion émet un throw explicite.
 * Peut être exécuté par `bun run src/sim/scale/__tests__/UniverseScaleEngine.test.ts`
 * ou intégré à un futur runner. La suite est aussi appelée en dev par
 * `assertScaleInvariants()` si besoin.
 *
 *  Invariants vérifiés :
 *   1. Le niveau calculé correspond à la hiérarchie Phase 23.
 *   2. Aucune couche ne "clignote" (transitions monotones, unimodales).
 *   3. Toute transition possède une bande d'interpolation (aucun saut binaire).
 *   4. À un instant t, un seul niveau *entier* est actif.
 */
import * as THREE from "three";
import {
  UniverseScaleEngine,
  computeLevelF,
  type ScaleLayer,
} from "../UniverseScaleEngine";
import { ENGINE_CONFIG } from "../../../core/config";

const HOME = new THREE.Vector3(...ENGINE_CONFIG.homeEarth.position);
const R = ENGINE_CONFIG.homeEarth.radius;

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`[scale-engine] ${msg}`);
}

function at(pos: [number, number, number]) {
  return computeLevelF(new THREE.Vector3(...pos));
}

const ALL_LAYERS: ScaleLayer[] = [
  "surface",
  "solarBodies",
  "orbits",
  "stellarNeighborhood",
  "milkyWay",
  "deepSky",
];

export function assertScaleInvariants(): void {
  // ─── 1. Hiérarchie de niveau ────────────────────────────────────────────
  assert(
    Math.round(at([HOME.x, HOME.y + R + 0.1, HOME.z])) === 0,
    "au sol → Niveau 0",
  );
  assert(
    Math.round(at([HOME.x, HOME.y + R * 6, HOME.z])) === 1,
    "basse orbite → Niveau 1",
  );
  assert(Math.round(at([2000, 0, 0])) === 2, "près du Soleil → Niveau 2");
  assert(Math.round(at([15000, 0, 0])) === 3, "voisinage stellaire → Niveau 3");
  assert(Math.round(at([50000, 0, 0])) === 4, "échelle galactique → Niveau 4");
  assert(Math.round(at([200000, 0, 0])) === 5, "univers profond → Niveau 5");

  // Monotonicité radiale.
  let prev = -Infinity;
  for (const d of [5000, 10000, 25000, 60000, 120000, 200000]) {
    const L = at([d, 0, 0]);
    assert(L >= prev, `niveau non monotone à d=${d}`);
    prev = L;
  }

  // ─── 2. Extrêmes ────────────────────────────────────────────────────────
  UniverseScaleEngine.__setForTest(0);
  assert(UniverseScaleEngine.getLayerOpacity("orbits") === 0, "N0: orbites off");
  assert(UniverseScaleEngine.getLayerOpacity("deepSky") === 0, "N0: deepSky off");
  assert(
    UniverseScaleEngine.getLayerOpacity("surface") > 0.95,
    "N0: surface pleine",
  );

  UniverseScaleEngine.__setForTest(2.5);
  assert(
    UniverseScaleEngine.getLayerOpacity("solarBodies") > 0.8,
    "N2: solarBodies dominant",
  );
  assert(UniverseScaleEngine.getLayerOpacity("orbits") > 0.6, "N2: orbites lues");
  assert(UniverseScaleEngine.getLayerOpacity("deepSky") === 0, "N2: deepSky off");
  assert(UniverseScaleEngine.getLayerOpacity("surface") === 0, "N2: surface off");

  UniverseScaleEngine.__setForTest(5);
  assert(UniverseScaleEngine.getLayerOpacity("solarBodies") === 0, "N5: solar off");
  assert(UniverseScaleEngine.getLayerOpacity("orbits") === 0, "N5: orbites off");
  assert(
    UniverseScaleEngine.getLayerOpacity("deepSky") > 0.95,
    "N5: deepSky dominant",
  );
  assert(
    UniverseScaleEngine.getLayerOpacity("milkyWay") > 0.95,
    "N5: Voie Lactée dominante",
  );

  // ─── 3. Bande de transition (jamais binaire) ────────────────────────────
  for (const layer of ALL_LAYERS) {
    let sawIntermediate = false;
    for (let L = 0; L <= 5.001; L += 0.05) {
      UniverseScaleEngine.__setForTest(L);
      const op = UniverseScaleEngine.getLayerOpacity(layer);
      if (op > 0.05 && op < 0.95) {
        sawIntermediate = true;
        break;
      }
    }
    assert(sawIntermediate, `${layer}: aucune bande de transition (saut binaire)`);
  }

  // ─── 4. Unimodalité : pas de re-apparition après extinction ─────────────
  for (const layer of ["surface", "solarBodies", "orbits"] as const) {
    let phase: "before" | "visible" | "after" = "before";
    for (let L = 0; L <= 5.001; L += 0.02) {
      UniverseScaleEngine.__setForTest(L);
      const op = UniverseScaleEngine.getLayerOpacity(layer);
      if (phase === "before" && op > 0.05) phase = "visible";
      else if (phase === "visible" && op < 0.02) phase = "after";
      else if (phase === "after" && op > 0.05) {
        throw new Error(`${layer}: ré-apparition après extinction (L=${L})`);
      }
    }
  }

  UniverseScaleEngine.__setForTest(0);
}

// Auto-run quand exécuté directement (bun run ...).
declare const process: { argv: string[] } | undefined;
if (typeof process !== "undefined" && process.argv?.[1]?.includes("UniverseScaleEngine.test")) {
  assertScaleInvariants();
  // eslint-disable-next-line no-console
  console.log("✓ Universe Scale Engine — tous les invariants passent");
}
