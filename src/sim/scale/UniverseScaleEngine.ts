/**
 * UniverseScaleEngine — PHASE 23. Verrou architectural.
 *
 * Unique autorité de visibilité pour AYAT AL-KAWN. Aucun composant de
 * scène ne décide seul de son opacité ou de son affichage : tous
 * interrogent cet engine. Une seule source de vérité, une seule
 * hiérarchie cohérente.
 *
 *  Niveau 0 — Surface terrestre (Observateur au sol)
 *  Niveau 1 — Terre / Lune (basse orbite)
 *  Niveau 2 — Système solaire (Soleil + planètes)
 *  Niveau 3 — Voisinage stellaire (le Soleil devient une étoile)
 *  Niveau 4 — Voie Lactée (le Soleil n'est qu'un point)
 *  Niveau 5 — Univers profond (galaxies observables)
 *
 * Le niveau courant est calculé de façon *continue* (float L∈[0,5])
 * à partir de la position caméra vs Terre-mère et vs Soleil, puis
 * chaque couche possède une courbe d'opacité par morceaux — jamais
 * de saut binaire. Les transitions sont progressives par construction.
 */

import * as THREE from "three";
import { ENGINE_CONFIG } from "../../core/config";

// ─── Layer taxonomy ────────────────────────────────────────────────────────
//
// Chaque couche du scene-graph est nommée. Elle n'existe qu'à travers ce
// registre ; ajouter une nouvelle couche = ajouter une entrée ici + une
// courbe d'opacité.

export type ScaleLayer =
  | "surface"          // Sol de la Terre-mère + city lights + limbe atmosphérique
  | "solarBodies"      // Soleil + planètes + lunes (meshes réels)
  | "orbits"           // Traces orbitales
  | "stellarNeighborhood" // Étoiles proches (catalogue nominatif)
  | "milkyWay"         // Voie Lactée (structure galactique)
  | "deepSky";         // Nébuleuses / galaxies / amas décoratifs distants

/**
 * La couche `realStars` (buffer HYG du ciel réel) est *toujours* visible.
 * Elle constitue le référentiel : le ciel réel n'est jamais éteint, du
 * sol jusqu'à l'univers profond. Elle n'est donc pas dans `ScaleLayer`.
 */

// ─── Level curves ──────────────────────────────────────────────────────────
//
// Piecewise linéaire : chaque courbe est une suite de (L, opacité).
// Interpolation linéaire entre points, plateau au-delà. Aucune couche ne
// peut être "cachée puis re-affichée" : les courbes sont unimodales et
// larges (bande de transition ≥ 0.6 niveau) pour éviter tout pop.

type Curve = ReadonlyArray<readonly [level: number, opacity: number]>;

const CURVES: Record<ScaleLayer, Curve> = {
  // Surface : dominante au sol, s'efface avant Niv.2. Le sol reste
  // physiquement présent (c'est un corps) mais devient un point.
  surface:            [[0.0, 1.0], [0.9, 1.0], [1.6, 0.0], [5.0, 0.0]],

  // Corps du système solaire : émergent en quittant l'atmosphère, plein
  // rendu Niv.2, s'éteignent quand le Soleil devient une étoile.
  solarBodies:        [[0.0, 0.0], [0.6, 0.0], [1.4, 1.0], [3.1, 1.0], [3.9, 0.0], [5.0, 0.0]],

  // Orbites : jamais visibles depuis le sol, actives Niv.2 seul.
  orbits:             [[0.0, 0.0], [1.7, 0.0], [2.2, 1.0], [2.9, 1.0], [3.5, 0.0], [5.0, 0.0]],

  // Voisinage stellaire (étoiles proches nominatives) : apparaît quand
  // le Soleil rejoint la population stellaire, reste jusqu'à la fin.
  stellarNeighborhood:[[0.0, 0.0], [2.5, 0.0], [3.3, 1.0], [5.0, 1.0]],

  // Voie Lactée : discrète au sol (bande visible), pleine puissance
  // au Niv.4, reste présente ensuite.
  milkyWay:           [[0.0, 0.25], [1.0, 0.25], [3.0, 1.0], [5.0, 1.0]],

  // Ciel profond décoratif : n'apparaît qu'à l'échelle intergalactique.
  deepSky:            [[0.0, 0.0], [3.5, 0.0], [4.5, 1.0], [5.0, 1.0]],
};

function evalCurve(curve: Curve, L: number): number {
  if (L <= curve[0][0]) return curve[0][1];
  for (let i = 0; i < curve.length - 1; i++) {
    const [x0, y0] = curve[i];
    const [x1, y1] = curve[i + 1];
    if (L <= x1) {
      const t = (L - x0) / Math.max(1e-6, x1 - x0);
      const s = t * t * (3 - 2 * t); // smoothstep, jamais linéaire visible
      return y0 + (y1 - y0) * s;
    }
  }
  return curve[curve.length - 1][1];
}

// ─── Level computation ─────────────────────────────────────────────────────

const HOME = new THREE.Vector3(...ENGINE_CONFIG.homeEarth.position);
const R = ENGINE_CONFIG.homeEarth.radius;
const SUN = new THREE.Vector3(0, 0, 0);

// Deux régimes :
//  - Régime "lié à la Terre-mère" : l'Observateur est plus proche de la
//    Terre que du Soleil. Le niveau est piloté par l'altitude Terre.
//  - Régime "libre" : l'Observateur est plus proche du Soleil (ou d'un
//    autre corps du système). Le niveau est piloté par la distance au
//    Soleil.
// Cette bascule évite qu'un vol vers le Soleil reste bloqué au Niv.1
// simplement parce que la Terre-mère est à 4200 unités de l'origine.

const ALT_ANCHORS = [
  [R * 0.5, 0.0],
  [R * 3.0, 0.7],
  [R * 12.0, 1.4],
] as const;

const SUN_ANCHORS = [
  [1500, 2.0],
  [6000, 2.5],
  [22000, 3.4],
  [70000, 4.4],
  [180000, 5.0],
] as const;

function interp(
  anchors: ReadonlyArray<readonly [number, number]>,
  x: number,
): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i];
    const [x1, y1] = anchors[i + 1];
    if (x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
  }
  return anchors[anchors.length - 1][1];
}

export function computeLevelF(camPosition: THREE.Vector3): number {
  const distEarth = camPosition.distanceTo(HOME);
  const distSun = camPosition.distanceTo(SUN);
  const alt = Math.max(0, distEarth - R);

  // Régime lié : plus proche de la Terre-mère que du Soleil.
  if (distEarth <= distSun) return interp(ALT_ANCHORS, alt);

  // Régime libre : la distance au Soleil pilote la progression.
  return interp(SUN_ANCHORS, distSun);
}


export function levelName(L: number): string {
  const names = [
    "Surface terrestre",
    "Terre-Lune",
    "Système solaire",
    "Voisinage stellaire",
    "Voie Lactée",
    "Univers profond",
  ];
  const i = Math.max(0, Math.min(5, Math.round(L)));
  return names[i];
}

// ─── Singleton engine ──────────────────────────────────────────────────────

type Listener = (level: number, levelF: number) => void;

class UniverseScaleEngineImpl {
  private levelF = 0;
  private level = 0;
  private listeners = new Set<Listener>();
  private tmp = new THREE.Vector3();

  /** Called from a single per-frame updater (see ScaleUpdater). */
  update(camPosition: THREE.Vector3): void {
    this.tmp.copy(camPosition);
    const next = computeLevelF(this.tmp);
    this.levelF = next;
    const nextInt = Math.max(0, Math.min(5, Math.round(next)));
    if (nextInt !== this.level) {
      this.level = nextInt;
      for (const l of this.listeners) l(this.level, this.levelF);
    }
  }

  getLevel(): number {
    return this.level;
  }

  getLevelF(): number {
    return this.levelF;
  }

  /** Opacity ∈ [0,1] a component should apply for its layer. */
  getLayerOpacity(layer: ScaleLayer): number {
    return evalCurve(CURVES[layer], this.levelF);
  }

  /**
   * Invariant : à un instant t, il existe un niveau entier "actif" unique
   * (celui de plus grande opacité effective sur les couches distinctives).
   * Utilisé par les tests et l'overlay debug.
   */
  activeLayers(): ScaleLayer[] {
    const out: ScaleLayer[] = [];
    (Object.keys(CURVES) as ScaleLayer[]).forEach((k) => {
      if (this.getLayerOpacity(k) > 0.05) out.push(k);
    });
    return out;
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Test helper — direct level injection. Never call from runtime. */
  __setForTest(levelF: number): void {
    this.levelF = levelF;
    this.level = Math.max(0, Math.min(5, Math.round(levelF)));
  }
}

export const UniverseScaleEngine = new UniverseScaleEngineImpl();
