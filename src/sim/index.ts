/**
 * Simulation layer — public entry point.
 *
 * The simulation layer is intentionally independent from rendering:
 * renderers in `src/world/**` *consume* these systems but never own them.
 */
export { TimeManager, SPEED_PRESETS, type SpeedPreset, type Tick } from "./TimeManager";
export { SimulationClock } from "./SimulationClock";
export { useSimFrame } from "./useSimFrame";
export { useRotation, type RotationConfig } from "./components/RotationComponent";
export { useOrbit, type OrbitConfig } from "./components/OrbitComponent";
export { ScaleManager, type ScaleDescriptor } from "./ScaleManager";
export { CatalogManager, type CatalogId, type CatalogTypeMap } from "./CatalogManager";
export { HIERARCHY_ORDER, type HierarchyLevel } from "./hierarchy";
export {
  stellarPositionToScene,
  compressDistance,
  type StellarCoordinates,
} from "./coords/stellar";
