import { useEffect, useState } from "react";
import { Engine } from "../engine/Engine";
import { WorldScene } from "../world/WorldScene";
import { TitleScreen } from "../ui/TitleScreen";
import { LoadingOverlay } from "../ui/LoadingOverlay";

/**
 * AyatApp — client-only composition root.
 * Orchestrates loading → title → exploration states. Rendering, world,
 * and UI remain independent modules; this file only wires them together.
 */
export function AyatApp() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exploring, setExploring] = useState(false);

  // Simulated boot sequence — replaced by real AssetManager streaming later.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setLoading(false), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white">
      <Engine>
        <WorldScene />
      </Engine>
      <TitleScreen visible={!loading && !exploring} onBegin={() => setExploring(true)} />
      <LoadingOverlay visible={loading} progress={progress} />
    </div>
  );
}
