import * as THREE from "three";

/**
 * FocusTarget — identifies a celestial body the camera should track.
 * Worlds register their world-space position; the camera system reads
 * the active target each frame and smoothly interpolates to it.
 */
export type FocusKey = "sun" | "earth" | "moon" | null;

interface TargetRecord {
  position: THREE.Vector3;
  /** Suggested viewing distance from the object's center. */
  distance: number;
}

class FocusRegistryImpl {
  private targets = new Map<Exclude<FocusKey, null>, TargetRecord>();
  private active: FocusKey = "earth";
  private listeners = new Set<(k: FocusKey) => void>();

  register(key: Exclude<FocusKey, null>, record: TargetRecord) {
    this.targets.set(key, record);
  }

  get(key: Exclude<FocusKey, null>): TargetRecord | undefined {
    return this.targets.get(key);
  }

  setActive(key: FocusKey) {
    this.active = key;
    for (const l of this.listeners) l(key);
  }

  getActive(): FocusKey {
    return this.active;
  }

  subscribe(cb: (k: FocusKey) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const FocusRegistry = new FocusRegistryImpl();
