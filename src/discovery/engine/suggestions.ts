import { DiscoveryGraph } from "../registry/graph";
import type { EntityId, RelationKind, Suggestion } from "../types";
import { resolveEntity } from "./resolver";

/**
 * SuggestionEngine — declarative selection of meaningful related entities.
 *
 * The order and weighting choices live here so UI components stay dumb.
 * Two surfaces:
 *   - related(id):           tight ring (satellites, siblings, parent).
 *   - continueExploring(id): a richer mix including topics and bridges.
 */

const RELATED_PRIORITY: RelationKind[] = [
  "satellite",
  "parent",
  "similar",
  "neighbor",
];

const CONTINUE_PRIORITY: RelationKind[] = [
  "satellite",
  "similar",
  "parent",
  "neighbor",
  "topic",
  "category",
];

function pickByKinds(
  id: EntityId,
  priority: RelationKind[],
  limit: number,
): Suggestion[] {
  const seen = new Set<EntityId>();
  const out: Suggestion[] = [];
  for (const kind of priority) {
    const edges = DiscoveryGraph.relationsOfKind(id, [kind]).sort(
      (a, b) => (b.weight ?? 0) - (a.weight ?? 0),
    );
    for (const e of edges) {
      if (seen.has(e.to)) continue;
      const sug = resolveEntity(e.to, e.kind);
      if (!sug) continue;
      seen.add(e.to);
      out.push(sug);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function related(id: EntityId, limit = 6): Suggestion[] {
  return pickByKinds(id, RELATED_PRIORITY, limit);
}

export function continueExploring(id: EntityId, limit = 6): Suggestion[] {
  return pickByKinds(id, CONTINUE_PRIORITY, limit);
}

export function topicsFor(id: EntityId, limit = 6): Suggestion[] {
  return pickByKinds(id, ["topic"], limit);
}
