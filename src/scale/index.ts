/**
 * Cosmic Scale Engine — public entry point.
 *
 * Independent layer: reuses the data catalogue, knowledge registry and
 * focus system but never mutates them. Other modules (Discovery, hotkeys,
 * Knowledge panel) drive the engine through the `ComparisonState` API.
 */
export { ComparisonState } from "./engine/state";
export { useComparisonState } from "./hooks/useComparisonState";
export { ComparisonOverlay } from "./components/ComparisonOverlay";
export { SCALE_JOURNEYS } from "./registry/journeys";
export { COMPARISON_LABELS, metricFor } from "./engine/metrics";
export { buildContextCard } from "./engine/context";
export { getBody, isComparable } from "./registry/bodyIndex";
export type { ComparisonKind, ScaleJourney, ContextCard } from "./types";
