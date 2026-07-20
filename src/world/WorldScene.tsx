import { RealStarfield, NearStarPromoter } from "./sky";
import { Universe } from "./scene/Universe";
import { SurfaceScene } from "./scene/SurfaceScene";
import { SelectionHighlight } from "./components/SelectionHighlight";

/**
 * WorldScene — single continuous reference frame.
 *
 * The sky is no longer a procedural particle system. `RealStarfield`
 * projects the full HYG naked-eye catalog (~9 000 real stars at their
 * real RA/Dec, compressed only in radial distance) and every point
 * has a stable identity in `SkyIdentityRegistry`. `NearStarPromoter`
 * transparently upgrades close-by entries into real `<Star>` meshes,
 * so flying toward a light grows it continuously — point → identifiable
 * star → real sun → system. There are no anonymous particles anywhere.
 */
export function WorldScene() {
  return (
    <>
      <RealStarfield />
      <NearStarPromoter />
      <Universe />
      <SurfaceScene />
      <SelectionHighlight />
    </>
  );
}
