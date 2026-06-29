import type { DeepSkyBodyData, DeepSkyKind } from "../../../data/deep-sky";

/**
 * Deep Sky form classifier.
 *
 * A handful of catalog ids carry distinctive morphologies that the
 * generic kind alone does not capture (e.g. M31 spiral vs. M104
 * lenticular vs. LMC irregular). We resolve to a small enum so each
 * renderer can pick a deterministic procedural recipe.
 */
export type GalaxyForm = "spiral" | "barred-spiral" | "elliptical" | "lenticular" | "irregular";

const FORMS: Record<string, GalaxyForm> = {
  andromeda: "spiral",
  triangulum: "spiral",
  whirlpool: "spiral",
  sombrero: "lenticular",
  lmc: "irregular",
  smc: "irregular",
};

export function galaxyFormFor(id: string): GalaxyForm {
  return FORMS[id] ?? "spiral";
}

export function isDeepSkyKind(k: DeepSkyKind, ...kinds: DeepSkyKind[]): boolean {
  return kinds.includes(k);
}

/** Stable numeric seed derived from an id. */
export function seedFromId(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cheap deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hex color → [r,g,b] 0..1. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

export interface DeepSkyRendererProps {
  data: DeepSkyBodyData;
}
