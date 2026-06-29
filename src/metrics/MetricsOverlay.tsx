import { useEffect, useState } from "react";
import { PerformanceMetrics, type MetricsSnapshot } from "./PerformanceMetrics";

/**
 * MetricsOverlay — developer diagnostics. Hidden by default; toggle with
 * the backtick key (`). Never visible to end-users unless requested.
 */
export function MetricsOverlay() {
  const [visible, setVisible] = useState(false);
  const [snap, setSnap] = useState<MetricsSnapshot>(PerformanceMetrics.get());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "~") setVisible((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => PerformanceMetrics.subscribe(setSnap), []);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-lg border border-white/10 bg-black/65 px-3 py-2 font-mono text-[10px] leading-relaxed text-white/80 backdrop-blur-md">
      <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-white/40">
        engine ·  ` to hide
      </div>
      <div>fps          {snap.fps.toFixed(1)}</div>
      <div>frame        {snap.frameMs.toFixed(2)} ms</div>
      <div>rendered     {snap.renderedObjects}</div>
      <div>regions      {snap.streamedRegions}</div>
      <div>catalogs     {snap.loadedCatalogs}</div>
    </div>
  );
}
