import type { KnowledgeEntry } from "../types/KnowledgeEntry";
import { SOLAR_SYSTEM_KNOWLEDGE } from "./solar-system";
import { STELLAR_KNOWLEDGE } from "./stars";

/**
 * KnowledgeRegistry — resolves a celestial body id to its educational entry.
 *
 * The rendering and simulation engines never import this file. UI consumers
 * read entries by the same id used by the FocusRegistry, keeping the
 * educational layer fully decoupled from the scene graph.
 *
 * Future modules can register entries dynamically (e.g. constellations,
 * exoplanets, missions) without touching the engine.
 */
class KnowledgeRegistryImpl {
  private entries = new Map<string, KnowledgeEntry>();

  register(entry: KnowledgeEntry): void {
    this.entries.set(entry.id, entry);
  }

  registerMany(entries: KnowledgeEntry[]): void {
    for (const e of entries) this.entries.set(e.id, e);
  }

  resolve(id: string | null | undefined): KnowledgeEntry | undefined {
    if (!id) return undefined;
    return this.entries.get(id);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  all(): KnowledgeEntry[] {
    return Array.from(this.entries.values());
  }
}

export const KnowledgeRegistry = new KnowledgeRegistryImpl();

// Default registrations — Solar System bodies.
KnowledgeRegistry.registerMany(SOLAR_SYSTEM_KNOWLEDGE);
