import { useEffect, useState } from "react";
import { UIState, type UISnapshot } from "../state/uiState";

export function useUIState(): UISnapshot {
  const [snap, setSnap] = useState<UISnapshot>(UIState.get());
  useEffect(() => UIState.subscribe(setSnap), []);
  return snap;
}
