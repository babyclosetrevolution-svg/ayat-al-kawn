import { useFrame } from "@react-three/fiber";
import { TimeManager } from "./TimeManager";

/**
 * useSimFrame — frame callback that receives *simulation* delta and elapsed,
 * not raw render time. Pausing or scaling time globally is then automatic.
 *
 * Use this everywhere a celestial system needs to advance physics.
 */
export function useSimFrame(
  cb: (simDelta: number, simElapsed: number) => void,
  priority = 0,
): void {
  useFrame(() => {
    cb(TimeManager.delta, TimeManager.elapsed);
  }, priority);
}
