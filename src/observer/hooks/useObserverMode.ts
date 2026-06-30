import { useObserver } from "./useObserver";
import type { ObserverMode } from "../types";

export function useObserverMode(): ObserverMode {
  return useObserver().mode;
}
