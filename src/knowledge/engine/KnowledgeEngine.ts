import { KnowledgeRegistry } from "../registry/KnowledgeRegistry";
import type { KnowledgeEntry } from "../types/KnowledgeEntry";

/**
 * KnowledgeEngine — small façade over the registry. Today it only resolves
 * entries; future modules (Quran Reflection, Historical Timeline, Missions,
 * AI Answers, Observation Notes, Favorites) will register additional
 * resolvers and section providers here without touching the rendering or
 * simulation engines.
 */

export type SectionProvider = (entry: KnowledgeEntry) => {
  id: string;
  title: string;
  render: () => unknown;
} | null;

class KnowledgeEngineImpl {
  private providers: SectionProvider[] = [];

  /** Extension point: future modules inject extra sections via providers. */
  registerSectionProvider(provider: SectionProvider): () => void {
    this.providers.push(provider);
    return () => {
      this.providers = this.providers.filter((p) => p !== provider);
    };
  }

  getSectionProviders(): readonly SectionProvider[] {
    return this.providers;
  }

  resolve(id: string | null | undefined): KnowledgeEntry | undefined {
    return KnowledgeRegistry.resolve(id);
  }
}

export const KnowledgeEngine = new KnowledgeEngineImpl();
