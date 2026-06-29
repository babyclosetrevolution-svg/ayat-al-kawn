/**
 * Audio Engine — shared types.
 *
 * The audio layer is a fully optional ambient soundscape. Nothing in the
 * rendering, simulation or knowledge engines depends on it; if the user
 * mutes everything (or audio fails to initialise) the rest of the app
 * keeps working unchanged.
 */

export type AudioChannel = "music" | "ambience" | "effects";

export interface AudioSettings {
  master: number; // 0..1
  music: number;
  ambience: number;
  effects: number;
  muted: boolean;
  /** User has interacted with the page once (required to start playback). */
  unlocked: boolean;
}

export interface AmbientLayerSpec {
  id: string;
  channel: AudioChannel;
  /** Procedural synth recipe — interpreted by the engine. */
  recipe: ProceduralRecipe;
  /** Crossfade time in seconds when activated/deactivated. */
  fade?: number;
  /** Per-layer gain (multiplied with channel + master). */
  gain?: number;
}

export interface ProceduralRecipe {
  /** Stylistic family — the engine picks a synth chain accordingly. */
  kind: "silence" | "wind" | "drone" | "pad" | "energy" | "shimmer";
  /** Base frequency (Hz). */
  baseHz?: number;
  /** Detune spread for stacked oscillators. */
  detune?: number;
  /** LFO modulation rate in Hz for slow movement. */
  lfoHz?: number;
  /** Noise color, 0 = white, 1 = brown. */
  noiseColor?: number;
  /** Filter cutoff (Hz). */
  cutoffHz?: number;
}

/** Ambience attached to a celestial body (or any FocusKey). */
export interface BodyAmbience {
  id: string;
  layers: AmbientLayerSpec[];
}
