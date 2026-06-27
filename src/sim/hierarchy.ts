/**
 * Coordinate Hierarchy — conceptual map of the engine's spatial layering.
 *
 *   Universe
 *     └─ Galaxy
 *          └─ SolarSystem
 *               └─ Star / Planet
 *                    └─ Local Space (moons, rings, atmosphere, surface)
 *
 * Each layer owns its own transform frame so child coordinates stay
 * numerically stable. Today the renderer only instantiates one Galaxy and
 * one SolarSystem, but every component above is in place so additional
 * systems / galaxies can be added without touching renderers.
 *
 * Layer responsibilities (current and planned):
 *
 *  - Universe       : root frame, global rotation, cosmological time.
 *  - Galaxy         : galactic disk, arms, dust, star catalog clouds.
 *  - SolarSystem    : barycentric frame, orbital propagation.
 *  - Star / Planet  : body-local frame, axial rotation, surface features.
 *  - Local Space    : moons, rings, atmosphere shaders, terrain LOD.
 */

export type HierarchyLevel =
  | "universe"
  | "galaxy"
  | "solar-system"
  | "body"
  | "local";

export const HIERARCHY_ORDER: readonly HierarchyLevel[] = [
  "universe",
  "galaxy",
  "solar-system",
  "body",
  "local",
];
