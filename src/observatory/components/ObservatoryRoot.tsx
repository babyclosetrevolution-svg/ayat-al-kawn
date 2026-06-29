import { useObservatoryState } from "../useObservatoryState";
import { ObservatoryScene } from "./ObservatoryScene";
import { ObservatoryOverlay } from "./ObservatoryOverlay";

/**
 * ObservatoryRoot — full-screen layer that activates in Observe My Sky
 * mode. The Universe canvas stays mounted below for instant return.
 */
export function ObservatoryRoot() {
  const s = useObservatoryState();
  if (s.mode !== "observatory") return null;
  return (
    <div className="fixed inset-0 z-30 bg-black">
      <ObservatoryScene />
      <ObservatoryOverlay />
    </div>
  );
}
