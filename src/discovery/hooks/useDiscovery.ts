import { useEffect, useMemo, useState } from "react";
import { FocusRegistry, type FocusKey } from "../../world/state/focus";
import { HistoryStore } from "../engine/history";
import {
  continueExploring,
  related,
  topicsFor,
} from "../engine/suggestions";
import { breadcrumbFor, type Crumb } from "../engine/breadcrumb";
import { isNavigable, resolveEntity } from "../engine/resolver";
import { LEARNING_PATHS } from "../registry/paths";
import type { HistoryEntry, LearningPath, Suggestion } from "../types";

/**
 * useActiveFocus — subscribes to the FocusRegistry. Mirrors the knowledge
 * hook so discovery surfaces always stay in lockstep with the active body.
 */
export function useActiveFocus(): FocusKey {
  const [id, setId] = useState<FocusKey>(FocusRegistry.getActive());
  useEffect(() => FocusRegistry.subscribe(setId), []);
  return id;
}

export function useRelatedObjects(id: FocusKey, limit = 6): Suggestion[] {
  return useMemo(() => (id ? related(id, limit) : []), [id, limit]);
}

export function useContinueExploring(id: FocusKey, limit = 6): Suggestion[] {
  return useMemo(() => (id ? continueExploring(id, limit) : []), [id, limit]);
}

export function useScientificTopics(id: FocusKey, limit = 6): Suggestion[] {
  return useMemo(() => (id ? topicsFor(id, limit) : []), [id, limit]);
}

export function useBreadcrumb(id: FocusKey): Crumb[] {
  return useMemo(() => breadcrumbFor(id), [id]);
}

export function useHistory(): HistoryEntry[] {
  const [items, setItems] = useState<HistoryEntry[]>(() => HistoryStore.get());
  useEffect(() => HistoryStore.subscribe(setItems), []);
  return items;
}

export function useLearningPaths(): LearningPath[] {
  return LEARNING_PATHS;
}

/**
 * Activate a discovery suggestion. Navigable entities focus the camera;
 * non-navigable topics are silently ignored at this layer — the caller
 * decides how to surface them (e.g. dedicated topic sheet later).
 */
export function activate(id: string): void {
  if (!isNavigable(id)) return;
  FocusRegistry.setActive(id);
  const sug = resolveEntity(id);
  if (sug) HistoryStore.visit({ id: sug.id, title: sug.title });
}
