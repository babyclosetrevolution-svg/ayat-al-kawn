/**
 * AssetManager — central registry for streamed assets (textures, models, datasets).
 * Phase 1: scaffold only. Future phases will plug loaders (KTX2, GLTF, JSON datasets).
 */
type AssetKind = "texture" | "model" | "dataset" | "audio";

interface AssetRecord<T = unknown> {
  id: string;
  kind: AssetKind;
  url: string;
  value?: T;
  promise?: Promise<T>;
}

class AssetManagerImpl {
  private registry = new Map<string, AssetRecord>();
  private listeners = new Set<(progress: number) => void>();

  register<T>(id: string, kind: AssetKind, url: string): AssetRecord<T> {
    const existing = this.registry.get(id) as AssetRecord<T> | undefined;
    if (existing) return existing;
    const record: AssetRecord<T> = { id, kind, url };
    this.registry.set(id, record);
    return record;
  }

  get<T>(id: string): AssetRecord<T> | undefined {
    return this.registry.get(id) as AssetRecord<T> | undefined;
  }

  onProgress(cb: (progress: number) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Emits a progress value in [0,1]. */
  emitProgress(progress: number): void {
    for (const cb of this.listeners) cb(progress);
  }

  clear(): void {
    this.registry.clear();
  }
}

export const AssetManager = new AssetManagerImpl();
export type { AssetKind, AssetRecord };
