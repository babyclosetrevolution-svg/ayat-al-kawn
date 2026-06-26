import { Starfield } from "./Starfield";

/**
 * WorldScene — top-level scene graph for the active "world".
 * Phase 1: only the deep-space starfield. Future phases mount astronomical
 * objects (Solar System, stars, galaxies) here as composable children.
 */
export function WorldScene() {
  return (
    <>
      <Starfield />
    </>
  );
}
