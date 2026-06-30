import { useEffect, useState } from "react";
import { Observer } from "../core/Observer";
import type { ObserverState } from "../types";

/**
 * useObserver — subscribes the consumer to the Observer state stream.
 * The Observer flushes at most once per frame, so this is cheap.
 */
export function useObserver(): ObserverState {
  const [s, set] = useState<ObserverState>(() => Observer.get());
  useEffect(() => Observer.subscribe(set), []);
  return s;
}
