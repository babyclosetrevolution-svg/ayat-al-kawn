import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { StreamingManager } from "../streaming/StreamingManager";

/**
 * FrameSampler — pushes FPS / frame time / scene size into
 * PerformanceMetrics at ~2 Hz. Mounted inside the Canvas, no output.
 */
export function FrameSampler() {
  const { scene } = useThree();
  const frames = useRef(0);
  const accum = useRef(0);
  const lastMs = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    accum.current += delta;
    lastMs.current = delta * 1000;
    if (accum.current < 0.5) return;

    let rendered = 0;
    scene.traverseVisible((o) => {
      if ((o as { isMesh?: boolean; isPoints?: boolean }).isMesh) rendered++;
      else if ((o as { isPoints?: boolean }).isPoints) rendered++;
    });

    PerformanceMetrics.patch({
      fps: frames.current / accum.current,
      frameMs: lastMs.current,
      renderedObjects: rendered,
      streamedRegions: StreamingManager.counts().active,
    });
    frames.current = 0;
    accum.current = 0;
  });

  return null;
}
