import { useEffect, useState } from "react";
import { ComparisonState, type ComparisonSnapshot } from "../engine/state";

export function useComparisonState(): ComparisonSnapshot {
  const [s, set] = useState<ComparisonSnapshot>(() => ComparisonState.get());
  useEffect(() => ComparisonState.subscribe(set), []);
  return s;
}
