import { DiscoveryGraph } from "../registry/graph";
import type { EntityId, Relation } from "../types";
import { titleOf } from "./resolver";

export interface Crumb {
  id: EntityId;
  title: string;
}

/**
 * Build a breadcrumb trail from the cosmological root to the active id by
 * walking `parent` relations. Always prefixed by a synthetic "Universe"
 * crumb so the user has a clear top-level anchor.
 */
export function breadcrumbFor(id: EntityId | null | undefined): Crumb[] {
  const trail: Crumb[] = [{ id: "universe", title: "Universe" }];
  if (!id) return trail;

  const chain: EntityId[] = [];
  let current: EntityId | null = id;
  const guard = new Set<EntityId>();
  while (current && !guard.has(current)) {
    chain.push(current);
    guard.add(current);
    const parentEdge: Relation | undefined = DiscoveryGraph.relationsOfKind(current, ["parent"])[0];
    const nextId: EntityId | null = parentEdge ? parentEdge.to : null;
    current = nextId;
  }
  chain.reverse();
  for (const c of chain) trail.push({ id: c, title: titleOf(c) });
  return trail;
}
