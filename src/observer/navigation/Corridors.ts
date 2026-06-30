import type { Vec3 } from "../types";

/**
 * Navigation Corridors — invisible travel routes prepared for future
 * guided experiences. The user never sees rails; corridors merely bias
 * the Observer's path planning toward cinematic waypoints when explicitly
 * activated by higher-level systems (e.g. Journeys).
 *
 * This module is foundation-only: registry + types. No path solver yet.
 */

export interface CorridorWaypoint {
  position: Vec3;
  /** Optional anchor body id, for corridors tethered to celestial objects. */
  anchor?: string;
  /** Suggested dwell time at this waypoint (seconds). */
  dwell?: number;
}

export interface Corridor {
  id: string;
  label?: string;
  waypoints: CorridorWaypoint[];
  /** Hint for path smoothing — higher = looser, more cinematic curves. */
  curvature?: number;
}

class CorridorRegistryImpl {
  private corridors = new Map<string, Corridor>();

  register(c: Corridor) {
    this.corridors.set(c.id, c);
  }

  get(id: string): Corridor | undefined {
    return this.corridors.get(id);
  }

  list(): Corridor[] {
    return [...this.corridors.values()];
  }

  clear() {
    this.corridors.clear();
  }
}

export const CorridorRegistry = new CorridorRegistryImpl();
