/**
 * ObjectLifecycle — reusable create / activate / deactivate / recycle.
 *
 * Streaming-eligible objects should be pooled rather than destroyed, so
 * large catalogs can stream in and out without GC churn. Phase 10 ships
 * the contract and a typed pool; renderers will adopt it as catalogs grow
 * beyond what fits in memory simultaneously.
 */
export type LifecycleState = "idle" | "active" | "recycled";

export interface Lifecycle<T> {
  create(): T;
  activate(value: T, input: unknown): void;
  deactivate(value: T): void;
  reset?(value: T): void;
}

export class ObjectPool<T> {
  private free: T[] = [];
  private inUse = new Set<T>();
  constructor(private spec: Lifecycle<T>, private initial = 0) {
    for (let i = 0; i < initial; i++) this.free.push(spec.create());
  }

  acquire(input: unknown): T {
    const value = this.free.pop() ?? this.spec.create();
    this.spec.activate(value, input);
    this.inUse.add(value);
    return value;
  }

  release(value: T): void {
    if (!this.inUse.has(value)) return;
    this.spec.deactivate(value);
    this.spec.reset?.(value);
    this.inUse.delete(value);
    this.free.push(value);
  }

  stats(): { free: number; active: number } {
    return { free: this.free.length, active: this.inUse.size };
  }
}
