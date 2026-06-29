/**
 * LODSystem — generic level-of-detail resolver.
 *
 * Renderers query the level for a given object (distance + screen size +
 * scale context) instead of hardcoding visibility thresholds. The system
 * is intentionally renderer-agnostic so it can drive meshes, billboards,
 * impostors or pure point sprites.
 */
export type LODLevel = "invisible" | "billboard" | "simplified" | "full";

export interface LODInput {
  /** Camera distance to the object, in scene units. */
  distance: number;
  /** Object radius in scene units (used for solid-angle estimate). */
  radius: number;
  /** Optional importance multiplier (focus/selection boost). */
  importance?: number;
}

export interface LODThresholds {
  /** Below this solid-angle proxy → invisible. */
  invisible: number;
  /** Up to this → billboard. */
  billboard: number;
  /** Up to this → simplified mesh. */
  simplified: number;
  // Above simplified → full mesh.
}

const DEFAULT_THRESHOLDS: LODThresholds = {
  invisible: 0.00005,
  billboard: 0.002,
  simplified: 0.02,
};

class LODSystemImpl {
  private thresholds: LODThresholds = DEFAULT_THRESHOLDS;

  configure(t: Partial<LODThresholds>): void {
    this.thresholds = { ...this.thresholds, ...t };
  }

  /** Returns a discrete LOD level for the given object. */
  resolve(input: LODInput): LODLevel {
    const importance = input.importance ?? 1;
    const proxy = (input.radius / Math.max(0.0001, input.distance)) * importance;
    const t = this.thresholds;
    if (proxy < t.invisible) return "invisible";
    if (proxy < t.billboard) return "billboard";
    if (proxy < t.simplified) return "simplified";
    return "full";
  }
}

export const LODSystem = new LODSystemImpl();
