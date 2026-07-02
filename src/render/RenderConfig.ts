/**
 * RenderConfig — centralized rendering settings.
 *
 * Single source of truth for every visual-quality knob: bloom, exposure,
 * atmosphere quality, starfield density, ring detail. Quality presets in
 * future phases (Low / Medium / High / Cinematic) will swap this object;
 * no rendering code reads magic numbers directly.
 *
 * Keep values physically inspired, not theatrical.
 */
export interface RenderConfig {
  exposure: {
    /** Base ACES exposure when no auto-adapt has occurred. */
    base: number;
    /** Min / max bounds for auto-exposure adaptation. */
    min: number;
    max: number;
    /** Adaptation rate (higher = snappier). */
    rate: number;
  };
  bloom: {
    enabled: boolean;
    intensity: number;
    luminanceThreshold: number;
    luminanceSmoothing: number;
    radius: number;
    /** Render-target resolution scale (1 = full, 0.5 = half). */
    resolutionScale: number;
  };
  star: {
    /** Corona outer-shell scale (multiple of star radius). */
    coronaScale: number;
    /** Corona color tint. */
    coronaColor: string;
    /** Glare-disc scale (sprite billboard, multiple of star radius). */
    glareScale: number;
    /** Glare opacity. */
    glareOpacity: number;
  };
  atmosphere: {
    /** Geometry segments per atmosphere shell. */
    segments: number;
    /** Global intensity multiplier. */
    intensity: number;
    /** Rim-falloff exponent (higher = thinner rim). */
    rimPower: number;
  };
  rings: {
    /** Self-shadow strength of the planet onto its rings. */
    shadowStrength: number;
    /** Radial segments. */
    radialSegments: number;
  };
  starfield: {
    /** Multiplier on ENGINE_CONFIG.starfield.count. */
    densityFactor: number;
    /** Milky-way band brightness (0..1). */
    milkyWayIntensity: number;
    /** Faint interstellar dust brightness (0..1). */
    dustIntensity: number;
  };
  ambient: {
    /** Scene-wide ambient light (very low — physical). */
    intensity: number;
    color: string;
  };
}

export const RENDER_CONFIG: RenderConfig = {
  exposure: {
    base: 0.92,
    min: 0.5,
    max: 1.18,
    rate: 0.5,
  },
  bloom: {
    enabled: true,
    // Restrained bloom: only true highlights (stars, Sun) should bleed.
    // Higher threshold + lower intensity keeps deep space genuinely dark.
    intensity: 0.38,
    luminanceThreshold: 0.86,
    luminanceSmoothing: 0.25,
    radius: 0.72,
    resolutionScale: 0.5,
  },
  star: {
    coronaScale: 2.2,
    coronaColor: "#ffd089",
    glareScale: 4.8,
    glareOpacity: 0.22,
  },
  atmosphere: {
    segments: 96,
    intensity: 1.0,
    rimPower: 2.8,
  },
  rings: {
    shadowStrength: 0.75,
    radialSegments: 224,
  },
  starfield: {
    densityFactor: 1.6,
    // The Milky-Way haze and dust were washing the sky brown. Kept as a
    // very faint suggestion of the galactic plane against black space.
    milkyWayIntensity: 0.18,
    dustIntensity: 0.05,
  },
  ambient: {
    intensity: 0.012,
    color: "#7a8aa6",
  },
};
