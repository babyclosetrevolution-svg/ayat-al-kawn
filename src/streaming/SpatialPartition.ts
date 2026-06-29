/**
 * SpatialPartition — generic hierarchical region tree.
 *
 *   Universe → Sector → Region → LocalSystem → Object
 *
 * Phase 10 ships the data structures and a uniform cubic partitioner.
 * Renderers never traverse this tree directly; the StreamingManager uses
 * it to decide which regions are active for the current camera pose and
 * scale level.
 *
 * The tree is intentionally generic: each node carries a center, radius
 * and an opaque payload bag. Catalogs (solar-system, stars, galaxies)
 * register their own region keys here so streaming logic stays uniform
 * across categories.
 */
import * as THREE from "three";

export type RegionLevel =
  | "universe"
  | "sector"
  | "region"
  | "local-system"
  | "object";

export interface RegionNode {
  id: string;
  level: RegionLevel;
  center: THREE.Vector3;
  /** Bounding sphere radius in scene units. */
  radius: number;
  parentId: string | null;
  children: string[];
  /** Catalog-defined payload (e.g. body ids belonging to this region). */
  payload?: Record<string, unknown>;
}

class SpatialPartitionImpl {
  private nodes = new Map<string, RegionNode>();
  private rootId: string | null = null;

  reset(): void {
    this.nodes.clear();
    this.rootId = null;
  }

  insert(node: Omit<RegionNode, "children">): RegionNode {
    const existing = this.nodes.get(node.id);
    if (existing) return existing;
    const full: RegionNode = { ...node, children: [] };
    this.nodes.set(node.id, full);
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent && !parent.children.includes(node.id)) {
        parent.children.push(node.id);
      }
    } else if (!this.rootId) {
      this.rootId = node.id;
    }
    return full;
  }

  get(id: string): RegionNode | undefined {
    return this.nodes.get(id);
  }

  root(): RegionNode | undefined {
    return this.rootId ? this.nodes.get(this.rootId) : undefined;
  }

  /** All nodes at the given hierarchy level. */
  atLevel(level: RegionLevel): RegionNode[] {
    const out: RegionNode[] = [];
    for (const n of this.nodes.values()) if (n.level === level) out.push(n);
    return out;
  }

  /** Regions whose bounding sphere contains the point. */
  query(point: THREE.Vector3, level?: RegionLevel): RegionNode[] {
    const out: RegionNode[] = [];
    for (const n of this.nodes.values()) {
      if (level && n.level !== level) continue;
      if (n.center.distanceTo(point) <= n.radius) out.push(n);
    }
    return out;
  }

  /** Nodes whose bounding sphere overlaps the camera sphere (range). */
  withinRange(point: THREE.Vector3, range: number, level?: RegionLevel): RegionNode[] {
    const out: RegionNode[] = [];
    for (const n of this.nodes.values()) {
      if (level && n.level !== level) continue;
      if (n.center.distanceTo(point) <= n.radius + range) out.push(n);
    }
    return out;
  }

  size(): number {
    return this.nodes.size;
  }
}

export const SpatialPartition = new SpatialPartitionImpl();

// Seed a default universe root so consumers always have a parent to attach to.
SpatialPartition.insert({
  id: "universe",
  level: "universe",
  center: new THREE.Vector3(0, 0, 0),
  radius: Number.POSITIVE_INFINITY,
  parentId: null,
});
