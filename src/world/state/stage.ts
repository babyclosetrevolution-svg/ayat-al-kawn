/**
 * StageState — Phase 22.6.
 *
 * The opening of AYAT AL-KAWN is not a "god-view" of the Solar System.
 * The Observer awakens on the surface of the Earth, looking toward the
 * horizon. The naked eye sees only faint stars and the diffuse Milky Way
 * band. Only when the Observer chooses to leave does the cosmic view
 * take over.
 *
 * This tiny store exposes the current stage so `WorldScene`, the camera
 * system and the HUD can react without coupling to each other.
 */
import { useEffect, useState } from "react";

export type Stage = "surface" | "cosmos";

let stage: Stage = "surface";
const listeners = new Set<(s: Stage) => void>();

export const StageState = {
  get(): Stage {
    return stage;
  },
  set(next: Stage) {
    if (next === stage) return;
    stage = next;
    for (const l of listeners) l(stage);
  },
  subscribe(cb: (s: Stage) => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

export function useStage(): Stage {
  const [s, setS] = useState<Stage>(stage);
  useEffect(() => StageState.subscribe(setS), []);
  return s;
}
