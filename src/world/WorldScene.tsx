import { Starfield } from "./Starfield";
import { Universe } from "./scene/Universe";

/**
 * WorldScene — top of the visible scene graph.
 * Phase 3: starfield backdrop + data-driven Universe.
 */
export function WorldScene() {
  return (
    <>
      <Starfield />
      <Universe />
    </>
  );
}
