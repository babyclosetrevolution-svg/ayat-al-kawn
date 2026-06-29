import type { BodyAmbience, AmbientLayerSpec } from "../types";

/**
 * AmbienceRegistry — id → ambient soundscape spec.
 *
 * Any module (a celestial body data file, deep-sky catalog, observatory)
 * can register an ambience without touching the audio engine. Resolution
 * falls back through a category default when no exact match is found.
 */

const DEFAULTS: Record<string, AmbientLayerSpec[]> = {
  planet: [
    {
      id: "default-planet",
      channel: "ambience",
      recipe: { kind: "drone", baseHz: 55, lfoHz: 0.06, cutoffHz: 500 },
      gain: 0.18,
    },
  ],
  star: [
    {
      id: "default-star",
      channel: "ambience",
      recipe: { kind: "energy", baseHz: 48, detune: 14, cutoffHz: 380, lfoHz: 0.1 },
      gain: 0.22,
    },
  ],
  moon: [
    { id: "default-moon", channel: "ambience", recipe: { kind: "silence" } },
  ],
  galaxy: [
    {
      id: "default-galaxy",
      channel: "ambience",
      recipe: { kind: "drone", baseHz: 38, lfoHz: 0.03, cutoffHz: 420 },
      gain: 0.25,
    },
    {
      id: "default-galaxy-shimmer",
      channel: "ambience",
      recipe: { kind: "shimmer", cutoffHz: 3000, lfoHz: 0.1 },
      gain: 0.05,
    },
  ],
  nebula: [
    {
      id: "default-nebula",
      channel: "ambience",
      recipe: { kind: "pad", baseHz: 65, lfoHz: 0.05, cutoffHz: 720 },
      gain: 0.22,
    },
  ],
  cluster: [
    {
      id: "default-cluster",
      channel: "ambience",
      recipe: { kind: "shimmer", cutoffHz: 2400, lfoHz: 0.12 },
      gain: 0.18,
    },
  ],
};

const SPECIFIC: Record<string, AmbientLayerSpec[]> = {
  earth: [
    {
      id: "earth-wind",
      channel: "ambience",
      recipe: { kind: "wind", noiseColor: 0.75, cutoffHz: 650, lfoHz: 0.15 },
      gain: 0.28,
    },
    {
      id: "earth-pad",
      channel: "ambience",
      recipe: { kind: "pad", baseHz: 110, lfoHz: 0.05, cutoffHz: 900 },
      gain: 0.08,
    },
  ],
  sun: [
    {
      id: "sun-energy",
      channel: "ambience",
      recipe: { kind: "energy", baseHz: 36, detune: 18, cutoffHz: 320, lfoHz: 0.08 },
      gain: 0.3,
    },
  ],
  moon: [
    { id: "moon-silence", channel: "ambience", recipe: { kind: "silence" } },
  ],
};

class AmbienceRegistryImpl {
  private map = new Map<string, BodyAmbience>();

  register(amb: BodyAmbience): void {
    this.map.set(amb.id, amb);
  }

  resolve(id: string | null | undefined, category?: string): AmbientLayerSpec[] {
    if (id) {
      const explicit = this.map.get(id);
      if (explicit) return explicit.layers;
      if (SPECIFIC[id]) return SPECIFIC[id];
    }
    if (category && DEFAULTS[category]) return DEFAULTS[category];
    return DEFAULTS.planet;
  }
}

export const AmbienceRegistry = new AmbienceRegistryImpl();
