import { FocusRegistry } from "../../world/state/focus";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";
import { ComparisonState } from "../../scale/engine/state";
import { ObservatoryState } from "../../observatory/state";
import { LocaleState } from "../../encyclopedia/i18n/locale";
import type { AssistantContext } from "../types";

/**
 * Snapshot the current application state into a compact context object
 * the assistant can ground its answers on. Nothing here calls a model —
 * this is pure observation.
 */
export function snapshotAssistantContext(): AssistantContext {
  const focusId = FocusRegistry.getActive();
  const entry = focusId ? KnowledgeRegistry.resolve(focusId) : undefined;
  const cs = ComparisonState.get();
  const obs = ObservatoryState.get();
  return {
    focusId,
    focusName: entry?.name,
    focusSummary: entry?.summary,
    comparison: cs.open ? { kind: cs.kind, ids: cs.ids } : undefined,
    discoveryTopic: undefined,
    observatoryMode: obs.mode === "observatory",
    locale: LocaleState.get(),
  };
}
