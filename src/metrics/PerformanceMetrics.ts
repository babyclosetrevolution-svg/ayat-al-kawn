/**
 * PerformanceMetrics — lightweight developer instrumentation.
 *
 * Pushed by the FrameSampler each frame and by streaming/catalog systems
 * when their state changes. The overlay reads via subscribe(). No metric
 * computation happens inside React render — keep this hot path cheap.
 */
export interface MetricsSnapshot {
  fps: number;
  frameMs: number;
  renderedObjects: number;
  streamedRegions: number;
  loadedCatalogs: number;
}

type Listener = (snap: MetricsSnapshot) => void;

class PerformanceMetricsImpl {
  private snap: MetricsSnapshot = {
    fps: 0,
    frameMs: 0,
    renderedObjects: 0,
    streamedRegions: 0,
    loadedCatalogs: 0,
  };
  private listeners = new Set<Listener>();

  patch(p: Partial<MetricsSnapshot>): void {
    this.snap = { ...this.snap, ...p };
    for (const cb of this.listeners) cb(this.snap);
  }

  get(): MetricsSnapshot {
    return this.snap;
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.snap);
    return () => this.listeners.delete(cb);
  }
}

export const PerformanceMetrics = new PerformanceMetricsImpl();
