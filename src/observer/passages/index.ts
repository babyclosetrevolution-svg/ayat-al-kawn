/**
 * Observer Passages — reserved for future seamless transitions between
 * scales (planet → system → galaxy → deep sky) with cinematic continuity.
 *
 * Foundation only: interface + registry. No implementation yet.
 */

export interface Passage {
  id: string;
  from: string;
  to: string;
  /** Optional corridor id from navigation registry. */
  corridor?: string;
}

class PassageRegistryImpl {
  private passages = new Map<string, Passage>();
  register(p: Passage) { this.passages.set(p.id, p); }
  get(id: string) { return this.passages.get(id); }
  list() { return [...this.passages.values()]; }
}

export const PassageRegistry = new PassageRegistryImpl();
