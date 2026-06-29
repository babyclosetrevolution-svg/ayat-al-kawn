/**
 * Streaming layer — public entry point.
 *
 * Renderers never own streaming decisions. They consume the snapshots
 * exposed by StreamingManager and the LOD levels resolved by LODSystem.
 */
export {
  SpatialPartition,
  type RegionNode,
  type RegionLevel,
} from "./SpatialPartition";
export {
  StreamingManager,
  type RegionStatus,
} from "./StreamingManager";
export {
  LODSystem,
  type LODLevel,
  type LODInput,
  type LODThresholds,
} from "./LODSystem";
export {
  ObjectPool,
  type Lifecycle,
  type LifecycleState,
} from "./ObjectLifecycle";
export { CameraStreamingBridge } from "./CameraStreamingBridge";
