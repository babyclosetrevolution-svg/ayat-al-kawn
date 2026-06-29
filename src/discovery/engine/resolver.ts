import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";
import { FocusRegistry } from "../../world/state/focus";
import { TOPIC_INDEX } from "../registry/topics";
import type { EntityId, Suggestion, RelationKind } from "../types";

/**
 * EntityResolver — turns an EntityId into a UI-ready suggestion record,
 * regardless of whether the id refers to a navigable body, a knowledge
 * entry, or a scientific topic. Keeps suggestion code declarative.
 */
export function resolveEntity(
  id: EntityId,
  kind: RelationKind | "history" = "category",
): Suggestion | null {
  // Topics first — they have stable id prefix.
  const topic = TOPIC_INDEX.get(id);
  if (topic) {
    return {
      id,
      title: topic.title,
      category: topic.category,
      description: topic.summary,
      kind,
      navigable: false,
    };
  }

  const entry = KnowledgeRegistry.resolve(id);
  if (entry) {
    return {
      id,
      title: entry.title,
      category: entry.category,
      description: entry.subtitle ?? entry.overview?.slice(0, 110),
      kind,
      navigable: FocusRegistry.get(id) !== undefined || entry.category !== "other",
    };
  }
  return null;
}

export function titleOf(id: EntityId): string {
  const t = TOPIC_INDEX.get(id);
  if (t) return t.title;
  const e = KnowledgeRegistry.resolve(id);
  return e?.title ?? id;
}

export function isNavigable(id: EntityId): boolean {
  if (TOPIC_INDEX.has(id)) return false;
  return KnowledgeRegistry.resolve(id) !== undefined;
}
