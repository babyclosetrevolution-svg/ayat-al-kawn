import { RENDER_CONFIG } from "../render/RenderConfig";

/**
 * LightingSystem — physically inspired ambient.
 *
 * The dominant light comes from the Sun's own pointLight (declared by the
 * Star component) so it tracks the body in world space. This system only
 * adds a very low scene-wide ambient term — Rayleigh-scattered starlight —
 * so the dark side of bodies isn't pitch black on under-tuned monitors.
 *
 * Real reflected ambient (planet onto its moons) is handled by the
 * point-light reach; no extra fill lights here, which keeps contrast
 * physical.
 */
export function LightingSystem() {
  const { intensity, color } = RENDER_CONFIG.ambient;
  return <ambientLight intensity={intensity} color={color} />;
}
