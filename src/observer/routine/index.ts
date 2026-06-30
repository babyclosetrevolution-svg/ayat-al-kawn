/**
 * Observer Routine — reserved for future autonomous behaviours
 * (idle wandering, ambient observation patterns, scheduled passes).
 *
 * Foundation only: registry skeleton. No implementation yet.
 */

export interface Routine {
  id: string;
  description?: string;
  /** Tick handler invoked by the routine scheduler (future). */
  tick?: (dt: number) => void;
}

class RoutineRegistryImpl {
  private routines = new Map<string, Routine>();
  register(r: Routine) { this.routines.set(r.id, r); }
  get(id: string) { return this.routines.get(id); }
  list() { return [...this.routines.values()]; }
}

export const RoutineRegistry = new RoutineRegistryImpl();
