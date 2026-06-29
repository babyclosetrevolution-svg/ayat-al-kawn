/**
 * StreamingManager — region load/unload orchestrator.
 *
 * Owns which regions of the SpatialPartition are *active* (objects
 * instantiated and rendered), *preloaded* (data fetched, not rendered)
 * or *idle*. Renderers subscribe; they never decide on their own which
 * regions to mount.
 *
 * Phase 10 ships the orchestration API. The current catalogs are small
 * enough to live entirely in memory, so the default policy simply marks
 * every registered region as active. The contract is what matters: when
 * catalogs grow, only this file changes.
 */
import * as THREE from "three";
import { SpatialPartition, type RegionNode } from "./SpatialPartition";

export type RegionStatus = "idle" | "preloaded" | "active";

interface StreamingPolicy {
  /** Distance at which a region becomes active (rendered). */
  activeRange: number;
  /** Distance at which a region becomes preloaded. */
  preloadRange: number;
}

const DEFAULT_POLICY: StreamingPolicy = {
  activeRange: 1e9,
  preloadRange: 1e9,
};

type Listener = (snapshot: ReadonlyMap<string, RegionStatus>) => void;

class StreamingManagerImpl {
  private status = new Map<string, RegionStatus>();
  private listeners = new Set<Listener>();
  private policy: StreamingPolicy = DEFAULT_POLICY;
  private cameraPos = new THREE.Vector3();

  configure(p: Partial<StreamingPolicy>): void {
    this.policy = { ...this.policy, ...p };
  }

  /** Tell the manager about a region (idempotent). Auto-recomputes status. */
  registerRegion(node: RegionNode): void {
    if (!this.status.has(node.id)) this.status.set(node.id, "idle");
    this.recompute();
  }

  /** Camera moved — recompute which regions should be loaded. */
  notifyCamera(position: THREE.Vector3): void {
    this.cameraPos.copy(position);
    this.recompute();
  }

  getStatus(id: string): RegionStatus {
    return this.status.get(id) ?? "idle";
  }

  isActive(id: string): boolean {
    return this.getStatus(id) === "active";
  }

  snapshot(): ReadonlyMap<string, RegionStatus> {
    return this.status;
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  counts(): { active: number; preloaded: number; idle: number } {
    let a = 0, p = 0, i = 0;
    for (const s of this.status.values()) {
      if (s === "active") a++;
      else if (s === "preloaded") p++;
      else i++;
    }
    return { active: a, preloaded: p, idle: i };
  }

  private recompute(): void {
    let dirty = false;
    for (const [id, prev] of this.status) {
      const node = SpatialPartition.get(id);
      if (!node) continue;
      const d = node.center.distanceTo(this.cameraPos) - node.radius;
      let next: RegionStatus;
      if (d <= this.policy.activeRange) next = "active";
      else if (d <= this.policy.preloadRange) next = "preloaded";
      else next = "idle";
      if (next !== prev) {
        this.status.set(id, next);
        dirty = true;
      }
    }
    if (dirty) for (const cb of this.listeners) cb(this.status);
  }
}

export const StreamingManager = new StreamingManagerImpl();
