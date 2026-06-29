import type { ContemplationCategory, ContemplationSettings } from "./types";

const INITIAL: ContemplationSettings = {
  active: false,
  enabled: { verse: true, reflection: true, quotation: true },
  rotationSeconds: 22,
};

class ContemplationStateImpl {
  private state: ContemplationSettings = { ...INITIAL };
  private listeners = new Set<(s: ContemplationSettings) => void>();
  get(): ContemplationSettings { return this.state; }
  subscribe(cb: (s: ContemplationSettings) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  private emit() { for (const l of this.listeners) l(this.state); }
  patch(p: Partial<ContemplationSettings>) {
    this.state = { ...this.state, ...p };
    this.emit();
  }
  toggleCategory(c: ContemplationCategory) {
    this.state = {
      ...this.state,
      enabled: { ...this.state.enabled, [c]: !this.state.enabled[c] },
    };
    this.emit();
  }
  toggleActive() { this.patch({ active: !this.state.active }); }
}

export const ContemplationState = new ContemplationStateImpl();
