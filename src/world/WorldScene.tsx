import { RealStarfield, NearStarPromoter } from "./sky";
import { Universe } from "./scene/Universe";
import { SurfaceScene } from "./scene/SurfaceScene";
import { SelectionHighlight } from "./components/SelectionHighlight";
import { ScaleUpdater, ScaleGroup } from "../sim/scale";

/**
 * WorldScene — référentiel unique et continu.
 *
 * Phase 23 (Universe Scale Engine) : chaque couche visuelle passe par
 * `<ScaleGroup layer="…">`. L'unique décideur de visibilité est
 * `UniverseScaleEngine`, mis à jour une fois par frame par
 * `<ScaleUpdater />`. Aucun composant enfant ne teste `stage`,
 * `altitude` ou une distance à la main.
 *
 * Le ciel réel (`RealStarfield`, ~9 000 étoiles HYG) et le promoteur
 * `NearStarPromoter` ne sont *jamais* éteints : le ciel réel est le
 * référentiel présent du sol jusqu'à l'univers profond.
 */
export function WorldScene() {
  return (
    <>
      <ScaleUpdater />
      <RealStarfield />
      <NearStarPromoter />
      <Universe />
      <ScaleGroup layer="surface">
        <SurfaceScene />
      </ScaleGroup>
      <SelectionHighlight />
    </>
  );
}
