import type { HistoryEntry } from "../types";

/**
 * HistoryStore — persistent, capped exploration trail.
 * Subscribes can update the "Recently Visited" surface in real time.
 */
const STORAGE_KEY = "ayat:discovery:history";
const LIMIT = 10;

class HistoryStoreImpl {
  private items: HistoryEntry[] = this.load();
  private listeners = new Set<(items: HistoryEntry[]) => void>();

  private load(): HistoryEntry[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HistoryEntry[];
      return Array.isArray(parsed) ? parsed.slice(0, LIMIT) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      /* storage may be disabled */
    }
  }

  private emit(): void {
    const snapshot = [...this.items];
    for (const l of this.listeners) l(snapshot);
  }

  get(): HistoryEntry[] {
    return [...this.items];
  }

  visit(entry: Omit<HistoryEntry, "visitedAt">): void {
    const now = Date.now();
    // Drop existing instance — move-to-front semantics.
    this.items = this.items.filter((e) => e.id !== entry.id);
    this.items.unshift({ ...entry, visitedAt: now });
    if (this.items.length > LIMIT) this.items.length = LIMIT;
    this.persist();
    this.emit();
  }

  clear(): void {
    this.items = [];
    this.persist();
    this.emit();
  }

  subscribe(cb: (items: HistoryEntry[]) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const HistoryStore = new HistoryStoreImpl();
