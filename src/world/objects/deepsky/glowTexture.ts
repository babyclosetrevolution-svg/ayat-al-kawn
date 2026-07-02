import * as THREE from "three";

/**
 * Shared soft radial-gradient texture used by every deep-sky sprite core
 * glow (galaxies, nebulae, supernova remnants). Without a map, a
 * `<spriteMaterial>` renders as a solid opaque quad — which surfaced as
 * pink/salmon squares floating near the Sun and Milky-Way band. Attaching
 * this alpha texture restores the intended round, feathered glow.
 *
 * Generated lazily on the client so SSR never touches `document`.
 */
let cached: THREE.CanvasTexture | null = null;

export function getSoftGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (cached) return cached;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.75, "rgba(255,255,255,0.12)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  cached = t;
  return cached;
}
