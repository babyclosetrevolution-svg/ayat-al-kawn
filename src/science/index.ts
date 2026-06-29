/**
 * Science Engine — public entry point.
 *
 * Independent layer: rendering, simulation and knowledge never import it.
 * World components opt in to live parameter bindings via `useScienceParam`.
 *
 * Future extension points (not implemented yet): climate simulations,
 * orbital mechanics, stellar evolution, planet formation, galaxy
 * evolution. Each would register additional experiences here.
 */
export { ScienceParams } from "./state/params";
export { useScienceParam } from "./hooks/useScienceParam";
export { ExperienceRegistry } from "./registry/experiences";
export { ScienceExploreView } from "./components/ScienceExploreView";
export type { ControlSpec, Experience, ParamValue } from "./types";
