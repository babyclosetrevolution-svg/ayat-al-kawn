/**
 * Observer Memory — reserved for future long-term recall of visited bodies,
 * inspection time, and discovery breadcrumbs at the Observer level.
 *
 * Foundation only: interfaces + registry. No implementation yet.
 */

export interface MemoryEntry {
  id: string;
  visitedAt: number;
  dwellSeconds: number;
  meta?: Record<string, unknown>;
}

export interface MemoryStore {
  record(entry: MemoryEntry): void;
  recall(id: string): MemoryEntry | undefined;
  list(): MemoryEntry[];
}

class NullMemory implements MemoryStore {
  record() {}
  recall() { return undefined; }
  list() { return []; }
}

export const ObserverMemory: MemoryStore = new NullMemory();
