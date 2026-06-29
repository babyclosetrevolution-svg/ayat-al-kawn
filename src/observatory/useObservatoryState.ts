import { useEffect, useState } from "react";
import { ObservatoryState, type ObservatoryStateSnapshot } from "./state";

export function useObservatoryState(): ObservatoryStateSnapshot {
  const [s, set] = useState<ObservatoryStateSnapshot>(() => ObservatoryState.get());
  useEffect(() => ObservatoryState.subscribe(set), []);
  return s;
}
