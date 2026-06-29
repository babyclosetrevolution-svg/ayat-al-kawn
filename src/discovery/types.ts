/**
 * Discovery Engine — shared types.
 *
 * The discovery layer is fully decoupled from rendering and simulation.
 * Every entity (object, topic, path) is referenced by a string id that
 * mirrors the FocusRegistry contract, so a relation can point to a
 * navigable body or a non-navigable concept without special casing.
 */

export type EntityId = string;

export type RelationKind =
  | "parent"
  | "child"
  | "satellite"
  | "neighbor"
  | "similar"
  | "category"
  | "formation"
  | "exploration"
  | "topic";

export interface Relation {
  /** Source entity id (the object the relation originates from). */
  from: EntityId;
  /** Target entity id. */
  to: EntityId;
  kind: RelationKind;
  /** Higher weights surface earlier in suggestions. */
  weight?: number;
  /** Short rationale shown under the discovery card. */
  reason?: string;
}

export interface Topic {
  id: EntityId;
  title: string;
  category: string;
  summary: string;
}

export interface LearningPath {
  id: string;
  title: string;
  summary: string;
  steps: EntityId[];
}

export interface HistoryEntry {
  id: EntityId;
  title: string;
  visitedAt: number;
}

export interface Suggestion {
  id: EntityId;
  title: string;
  category: string;
  description?: string;
  kind: RelationKind | "history";
  /** True when the id resolves to a focusable body. */
  navigable: boolean;
}
