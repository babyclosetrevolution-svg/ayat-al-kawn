import { useFrame } from "@react-three/fiber";
import { TimeManager } from "./TimeManager";

/**
 * SimulationClock — single source of truth that advances TimeManager once
 * per real frame, before any other useFrame callback (negative priority).
 *
 * Mount once, near the top of the Canvas. Without it, the simulation is
 * frozen even though rendering continues.
 */
export function SimulationClock() {
  useFrame((_, realDelta) => {
    TimeManager.tick(realDelta);
  }, -1000);
  return null;
}
