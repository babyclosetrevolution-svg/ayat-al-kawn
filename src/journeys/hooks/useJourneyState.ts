import { useEffect, useState } from "react";
import { JourneyEngine } from "../engine/JourneyEngine";
import type { JourneyRuntimeState } from "../types";

export function useJourneyState(): JourneyRuntimeState {
  const [s, set] = useState<JourneyRuntimeState>(() => JourneyEngine.get());
  useEffect(() => JourneyEngine.subscribe(set), []);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const delta = (t - last) / 1000;
      last = t;
      JourneyEngine.tick(delta);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return s;
}
