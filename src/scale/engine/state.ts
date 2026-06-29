import type { ComparisonKind } from "../types";

/**
 * ComparisonState — global, observable selection for the scale overlay.
 *
 * Kept outside React so any module (Discovery, Knowledge, hotkeys) can
 * push selections without prop drilling. Mirrors the singleton style of
 * UIState and FocusRegistry.
 */
export interface ComparisonSnapshot {
  open: boolean;
  kind: ComparisonKind;
  ids: string[];
  /** Active journey id, if a guided sequence is playing. */
  journeyId: string | null;
  journeyStep: number;
}

const INITIAL: ComparisonSnapshot = {
  open: false,
  kind: "diameter",
  ids: [],
  journeyId: null,
  journeyStep: 0,
};

class ComparisonStateImpl {
  private state: ComparisonSnapshot = { ...INITIAL };
  private listeners = new Set<(s: ComparisonSnapshot) => void>();

  get(): ComparisonSnapshot {
    return this.state;
  }

  private update(patch: Partial<ComparisonSnapshot>) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }

  openWith(ids: string[], kind?: ComparisonKind): void {
    const unique = Array.from(new Set(ids)).filter(Boolean);
    this.update({
      open: true,
      ids: unique,
      kind: kind ?? this.state.kind,
      journeyId: null,
      journeyStep: 0,
    });
  }

  add(id: string): void {
    if (this.state.ids.includes(id)) return;
    this.update({ ids: [...this.state.ids, id].slice(-4) });
  }

  remove(id: string): void {
    this.update({ ids: this.state.ids.filter((x) => x !== id) });
  }

  setKind(kind: ComparisonKind): void {
    this.update({ kind });
  }

  startJourney(id: string, steps: string[], kind: ComparisonKind): void {
    if (steps.length === 0) return;
    this.update({
      open: true,
      journeyId: id,
      journeyStep: 0,
      kind,
      ids: steps.slice(0, 1),
    });
  }

  advanceJourney(allSteps: string[]): void {
    const next = this.state.journeyStep + 1;
    if (next >= allSteps.length) return;
    this.update({
      journeyStep: next,
      ids: allSteps.slice(0, next + 1),
    });
  }

  exitJourney(): void {
    this.update({ journeyId: null, journeyStep: 0 });
  }

  close(): void {
    this.update({ open: false, journeyId: null, journeyStep: 0 });
  }

  subscribe(cb: (s: ComparisonSnapshot) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const ComparisonState = new ComparisonStateImpl();
