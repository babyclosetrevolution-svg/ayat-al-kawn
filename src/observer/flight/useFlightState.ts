import { useEffect, useState } from "react";
import { FlightState, type FlightSnapshot } from "./FlightState";

export function useFlightState(): FlightSnapshot {
  const [s, set] = useState<FlightSnapshot>(() => ({ ...FlightState.get() }));
  useEffect(
    () => FlightState.subscribe((next) => set({ ...next })),
    [],
  );
  return s;
}
