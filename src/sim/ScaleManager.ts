/**
 * ScaleManager — prepares the engine for spatial-scale transitions.
 *
 * The Universe is too vast to live in a single coordinate space. Future
 * phases will hand off rendering between concentric "levels" as the camera
 * zooms out (planetary surface → planetary space → solar system →
 * interstellar → galactic). This manager owns the current level and
 * notifies systems that must reconfigure (LOD, units-per-scene, fog,
 * culling, catalog selection).
 *
 * Phase 4 ships the public API only; no visual transitions occur yet.
 */

export type ScaleLevel =
  | "planetary"
  | "system"
  | "interstellar"
  | "galactic";

interface ScaleDescriptor {
  level: ScaleLevel;
  /** Approximate diameter of the scale's region of interest, meters. */
  diameterMeters: number;
  /** Suggested scene units used to express one meter at this level. */
  unitsPerMeter: number;
}

const DESCRIPTORS: Record<ScaleLevel, ScaleDescriptor> = {
  planetary: { level: "planetary", diameterMeters: 5e7, unitsPerMeter: 1e-6 },
  system: { level: "system", diameterMeters: 1e13, unitsPerMeter: 2e-10 },
  interstellar: {
    level: "interstellar",
    diameterMeters: 1e18,
    unitsPerMeter: 1e-15,
  },
  galactic: {
    level: "galactic",
    diameterMeters: 1e21,
    unitsPerMeter: 1e-18,
  },
};

type Listener = (level: ScaleLevel) => void;

class ScaleManagerImpl {
  private _current: ScaleLevel = "system";
  private listeners = new Set<Listener>();

  get current(): ScaleLevel {
    return this._current;
  }

  descriptor(level: ScaleLevel = this._current): ScaleDescriptor {
    return DESCRIPTORS[level];
  }

  setScale(level: ScaleLevel): void {
    if (this._current === level) return;
    this._current = level;
    for (const l of this.listeners) l(level);
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const ScaleManager = new ScaleManagerImpl();
export type { ScaleDescriptor };
