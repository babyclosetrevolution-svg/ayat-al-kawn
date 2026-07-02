import * as THREE from "three";

/**
 * FocusRegistry — every renderable celestial body publishes its world-space
 * position here so the CameraSystem can lerp toward whichever id is active.
 *
 * FocusKey is intentionally `string | null`: it is the body's `id`, which keeps
 * the registry data-driven (new planets register their id automatically).
 */
export type FocusKey = string | null;

interface TargetRecord {
  position: THREE.Vector3;
  /** Suggested viewing distance from the object's center. */
  distance: number;
}

class FocusRegistryImpl {
  private targets = new Map<string, TargetRecord>();
  // No default focus — landing page must open in silence, with no UI
  // halo drawn around any body. A focus is only set when the user picks
  // one (Explorer panel, Discovery card, camera preset, etc.).
  private active: FocusKey = null;
  private listeners = new Set<(k: FocusKey) => void>();

  register(key: string, record: TargetRecord) {
    this.targets.set(key, record);
  }

  get(key: string): TargetRecord | undefined {
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
