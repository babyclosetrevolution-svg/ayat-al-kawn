import { Starfield } from "./Starfield";
import { Universe } from "./scene/Universe";
import { SelectionHighlight } from "./components/SelectionHighlight";

/**
 * WorldScene — top of the visible scene graph.
 */
export function WorldScene() {
  return (
    <>
      <Starfield />
      <Universe />
      <SelectionHighlight />
    </>
  );
}

