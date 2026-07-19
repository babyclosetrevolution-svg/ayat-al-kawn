import { Starfield } from "./Starfield";
import { Universe } from "./scene/Universe";
import { SurfaceScene } from "./scene/SurfaceScene";
import { SelectionHighlight } from "./components/SelectionHighlight";

/**
 * WorldScene — single continuous reference frame.
 *
 * There is no longer a "surface" vs "cosmos" stage swap. The Universe
 * (Solar System + deep sky), the shared Starfield and the home Earth
 * surface (ground, city lights, atmospheric limb, real sky shell) are
 * all rendered at once. Leaving Earth is a real flight through a real
 * space — the atmosphere simply thins as altitude grows. Aiming a
 * direction *is* reaching it: nothing dis-anchors between the sky the
 * user looks at and the cosmos they travel through.
 */
export function WorldScene() {
  return (
    <>
      <Starfield />
      <Universe />
      <SurfaceScene />
      <SelectionHighlight />
    </>
  );
}
