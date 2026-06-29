/**
 * Discovery — public surface.
 *
 * The Discovery module is independent of rendering, simulation and
 * knowledge engines. It composes information already published by those
 * systems into navigable suggestions, breadcrumbs, history and paths.
 */
export { DiscoveryGraph } from "./registry/graph";
export { TOPICS } from "./registry/topics";
export { LEARNING_PATHS } from "./registry/paths";
export { HistoryStore } from "./engine/history";
export { related, continueExploring, topicsFor } from "./engine/suggestions";
export { breadcrumbFor } from "./engine/breadcrumb";
export type { Crumb } from "./engine/breadcrumb";
export * from "./types";
export * from "./hooks/useDiscovery";
export { DiscoveryView } from "./components/DiscoveryView";
export { DiscoveryCard } from "./components/DiscoveryCard";
export { Breadcrumb } from "./components/Breadcrumb";
