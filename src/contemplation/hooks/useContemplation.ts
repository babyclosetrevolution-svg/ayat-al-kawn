import { useEffect, useState } from "react";
import { ContemplationState } from "../state";
import type { ContemplationSettings } from "../types";

export function useContemplation(): ContemplationSettings {
  const [s, set] = useState<ContemplationSettings>(() => ContemplationState.get());
  useEffect(() => ContemplationState.subscribe(set), []);
  return s;
}
