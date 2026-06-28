/**
 * VisibilityRegistry — toggleable visual aids (orbit lines, labels, grids).
 *
 * Mirrors the FocusRegistry pattern: a tiny pub/sub store consumed by both
 * UI controls and scene components, with no React-Three dependency.
 */
export type VisibilityFlag = "orbits" | "labels";

type State = Record<VisibilityFlag, boolean>;

class VisibilityRegistryImpl {
  private state: State = { orbits: true, labels: false };
  private listeners = new Set<(s: State) => void>();

  get(flag: VisibilityFlag): boolean {
    return this.state[flag];
  }

  set(flag: VisibilityFlag, value: boolean): void {
    if (this.state[flag] === value) return;
    this.state = { ...this.state, [flag]: value };
    for (const l of this.listeners) l(this.state);
  }

  toggle(flag: VisibilityFlag): void {
    this.set(flag, !this.state[flag]);
  }

  snapshot(): State {
    return this.state;
  }

  subscribe(cb: (s: State) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const VisibilityRegistry = new VisibilityRegistryImpl();
