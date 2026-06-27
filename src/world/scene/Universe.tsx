import { SOLAR_SYSTEM_BODIES } from "../../data/solar-system/bodies";
import { Galaxy } from "./Galaxy";
import { SolarSystem } from "./SolarSystem";

/**
 * Universe — root of the astronomical scene graph.
 *
 *   Universe → Galaxy → SolarSystem → Star → Planet → Moon
 *
 * Phase 3 ships a single Galaxy hosting a single SolarSystem. The shape is
 * what matters: future phases plug additional systems / galaxies in here
 * without touching the rendering layer.
 */
export function Universe() {
  return (
    <Galaxy>
      <SolarSystem bodies={SOLAR_SYSTEM_BODIES} />
    </Galaxy>
  );
}
