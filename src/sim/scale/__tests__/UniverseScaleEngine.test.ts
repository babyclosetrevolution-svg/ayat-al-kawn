/**
 * Tests garantissant les invariants du Universe Scale Engine.
 *  - Un seul niveau entier actif à un instant t.
 *  - Toute couche a une bande de transition (jamais de saut binaire).
 *  - Les couches respectent la hiérarchie décrite Phase 23.
 *
 * Exécution : `bun test src/sim/scale/__tests__` (bun a un test runner
 * intégré compatible `expect`).
 */
import { describe, expect, it, beforeEach } from "bun:test";
import { UniverseScaleEngine, computeLevelF } from "../UniverseScaleEngine";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../../../core/config";

const HOME = new THREE.Vector3(...ENGINE_CONFIG.homeEarth.position);
const R = ENGINE_CONFIG.homeEarth.radius;

function at(pos: [number, number, number]) {
  return computeLevelF(new THREE.Vector3(...pos));
}

describe("UniverseScaleEngine — niveau calculé", () => {
  it("au sol → Niveau 0", () => {
    const L = at([HOME.x, HOME.y + R + 0.1, HOME.z]);
    expect(Math.round(L)).toBe(0);
  });

  it("basse orbite → Niveau 1", () => {
    const L = at([HOME.x, HOME.y + R * 6, HOME.z]);
    expect(Math.round(L)).toBe(1);
  });

  it("proche du Soleil → Niveau 2", () => {
    const L = at([2000, 0, 0]);
    expect(Math.round(L)).toBe(2);
  });

  it("voisinage stellaire → Niveau 3", () => {
    const L = at([15000, 0, 0]);
    expect(Math.round(L)).toBe(3);
  });

  it("échelle galactique → Niveau 4", () => {
    const L = at([50000, 0, 0]);
    expect(Math.round(L)).toBe(4);
  });

  it("univers profond → Niveau 5", () => {
    const L = at([200000, 0, 0]);
    expect(Math.round(L)).toBe(5);
  });

  it("est monotone en s'éloignant du Soleil", () => {
    let prev = -Infinity;
    for (const d of [5000, 10000, 25000, 60000, 120000, 200000]) {
      const L = at([d, 0, 0]);
      expect(L).toBeGreaterThanOrEqual(prev);
      prev = L;
    }
  });
});

describe("UniverseScaleEngine — invariants de couches", () => {
  beforeEach(() => UniverseScaleEngine.__setForTest(0));

  it("Niveau 0 : orbites et deepSky invisibles ; surface pleine", () => {
    UniverseScaleEngine.__setForTest(0);
    expect(UniverseScaleEngine.getLayerOpacity("orbits")).toBe(0);
    expect(UniverseScaleEngine.getLayerOpacity("deepSky")).toBe(0);
    expect(UniverseScaleEngine.getLayerOpacity("surface")).toBeGreaterThan(0.95);
  });

  it("Niveau 2 : orbites et corps solaires actifs, deepSky éteint", () => {
    UniverseScaleEngine.__setForTest(2.5);
    expect(UniverseScaleEngine.getLayerOpacity("solarBodies")).toBeGreaterThan(0.8);
    expect(UniverseScaleEngine.getLayerOpacity("orbits")).toBeGreaterThan(0.6);
    expect(UniverseScaleEngine.getLayerOpacity("deepSky")).toBe(0);
    expect(UniverseScaleEngine.getLayerOpacity("surface")).toBe(0);
  });

  it("Niveau 5 : univers profond dominant, solaire totalement éteint", () => {
    UniverseScaleEngine.__setForTest(5);
    expect(UniverseScaleEngine.getLayerOpacity("solarBodies")).toBe(0);
    expect(UniverseScaleEngine.getLayerOpacity("orbits")).toBe(0);
    expect(UniverseScaleEngine.getLayerOpacity("deepSky")).toBeGreaterThan(0.95);
    expect(UniverseScaleEngine.getLayerOpacity("milkyWay")).toBeGreaterThan(0.95);
  });

  it("toute couche a une bande de transition (pas de saut binaire)", () => {
    for (const layer of ["surface", "solarBodies", "orbits", "stellarNeighborhood", "milkyWay", "deepSky"] as const) {
      let sawIntermediate = false;
      for (let L = 0; L <= 5.001; L += 0.05) {
        UniverseScaleEngine.__setForTest(L);
        const op = UniverseScaleEngine.getLayerOpacity(layer);
        if (op > 0.05 && op < 0.95) {
          sawIntermediate = true;
          break;
        }
      }
      expect(sawIntermediate).toBe(true);
    }
  });

  it("transitions monotones : chaque couche apparaît puis disparaît sans oscillation", () => {
    // Les couches unimodales : un seul intervalle contigu de visibilité.
    for (const layer of ["surface", "solarBodies", "orbits"] as const) {
      let phase: "before" | "visible" | "after" = "before";
      for (let L = 0; L <= 5.001; L += 0.02) {
        UniverseScaleEngine.__setForTest(L);
        const op = UniverseScaleEngine.getLayerOpacity(layer);
        if (phase === "before" && op > 0.05) phase = "visible";
        else if (phase === "visible" && op < 0.02) phase = "after";
        else if (phase === "after" && op > 0.05) {
          throw new Error(`${layer} re-apparaît après extinction (L=${L})`);
        }
      }
    }
  });
});
