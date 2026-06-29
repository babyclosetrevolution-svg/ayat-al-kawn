/**
 * Knowledge Engine — generic schema.
 *
 * One shape covers stars, planets, moons, asteroids, comets, and any future
 * astronomical or scientific object. Every section is optional so partial
 * datasets render gracefully. Rendering components never import this file;
 * the Knowledge Engine is a fully independent educational layer.
 */

export type KnowledgeCategory =
  | "star"
  | "planet"
  | "moon"
  | "asteroid"
  | "comet"
  | "dwarf-planet"
  | "galaxy"
  | "nebula"
  | "other";

export interface QuickFact {
  label: string;
  value: string;
  /** Optional unit appended after the value (e.g. "km", "K"). */
  unit?: string;
}

export interface KeyedFact {
  label: string;
  value: string;
}

export interface Reference {
  title: string;
  url?: string;
  source?: string;
}

export interface SatelliteSummary {
  name: string;
  note?: string;
}

export interface ExplorationEvent {
  year: number | string;
  mission: string;
  agency?: string;
  note?: string;
}

/**
 * Extension slot. Future modules (Quran Reflection, Historical Timeline,
 * Missions, AI Answers, Observation Notes, Favorites…) attach data here
 * without modifying the schema. The Knowledge Panel renders nothing for
 * unknown keys — modules opt in via their own renderers.
 */
export type KnowledgeExtensions = Record<string, unknown>;

export interface KnowledgeEntry {
  id: string;
  title: string;
  subtitle?: string;
  category: KnowledgeCategory;

  overview?: string;
  quickFacts?: QuickFact[];

  scientificDescription?: string;
  physicalProperties?: KeyedFact[];
  atmosphere?: { summary?: string; composition?: KeyedFact[] };
  internalStructure?: { summary?: string; layers?: KeyedFact[] };
  surface?: { summary?: string; features?: KeyedFact[] };

  satellites?: SatelliteSummary[];
  exploration?: { summary?: string; timeline?: ExplorationEvent[] };

  interestingFacts?: string[];
  references?: Reference[];

  /** Reserved for future modules. Never read by the core panel. */
  ext?: KnowledgeExtensions;
}
