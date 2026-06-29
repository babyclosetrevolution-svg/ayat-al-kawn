import type { ParamValue } from "../types";

/**
 * ScienceParams — observable key/value store for all scientific parameters.
 *
 * Keys are namespaced by body id ("earth.atmosphereIntensity"). The store
 * keeps the *current* value plus a registered default so any control can
 * reset cleanly. Subscribers receive updates only for the key they watch.
 *
 * Lives in `src/science/` and is intentionally agnostic of the rendering
 * engine — bindings live in the world components that opt in.
 */
class ScienceParamsImpl {
  private values = new Map<string, ParamValue>();
  private defaults = new Map<string, ParamValue>();
  private listeners = new Map<string, Set<(v: ParamValue) => void>>();

  registerDefault(key: string, def: ParamValue): void {
    if (!this.defaults.has(key)) this.defaults.set(key, def);
  }

  get<T extends ParamValue>(key: string, fallback?: T): T {
    if (this.values.has(key)) return this.values.get(key) as T;
    if (this.defaults.has(key)) return this.defaults.get(key) as T;
    return fallback as T;
  }

  set(key: string, value: ParamValue): void {
    this.values.set(key, value);
    this.emit(key, value);
  }

  reset(key: string): void {
    const def = this.defaults.get(key);
    this.values.delete(key);
    if (def !== undefined) this.emit(key, def);
  }

  /** Reset every key beginning with the given namespace ("earth."). */
  resetNamespace(prefix: string): void {
    for (const k of Array.from(this.values.keys())) {
      if (k.startsWith(prefix)) this.reset(k);
    }
  }

  subscribe(key: string, cb: (v: ParamValue) => void): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(cb);
    return () => {
      set?.delete(cb);
    };
  }

  private emit(key: string, value: ParamValue): void {
    const set = this.listeners.get(key);
    if (!set) return;
    for (const cb of set) cb(value);
  }
}

export const ScienceParams = new ScienceParamsImpl();
