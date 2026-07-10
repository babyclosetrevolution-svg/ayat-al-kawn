import { Starfield } from "./Starfield";
import { Universe } from "./scene/Universe";
import { SurfaceScene } from "./scene/SurfaceScene";
import { SelectionHighlight } from "./components/SelectionHighlight";
import { useStage } from "./state/stage";

/**
 * WorldScene — top of the visible scene graph.
 *
 * Two stages coexist:
 *  - "surface": Observer stands on Earth, looks toward the horizon.
 *  - "cosmos" : full Universe scene graph (Solar System + deep sky).
 * The shared Starfield remains in both stages so the sky is continuous.
 */
export function WorldScene() {
  const stage = useStage();
  return (
    <>
      <Starfield />
      {stage === "cosmos" ? <Universe /> : <SurfaceScene />}
      <SelectionHighlight />
    </>
  );
}
