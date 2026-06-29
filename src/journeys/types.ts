import type { LocalizedText } from "../encyclopedia/types";

/**
 * Guided Journeys — shared types.
 *
 * A journey is a sequence of chapters. Each chapter targets a celestial
 * body (FocusKey), optionally opens a comparison or discovery overlay,
 * and carries educational notes + a narration placeholder for future
 * multilingual voiceover.
 */

export type JourneyOverlay =
  | { kind: "none" }
  | { kind: "comparison"; ids: string[]; comparisonKind?: "diameter" | "mass" | "distance" | "orbit" }
  | { kind: "discovery"; topic?: string };

export interface JourneyChapter {
  id: string;
  /** Target focus id — drives CameraDirector via FocusRegistry. */
  focus: string;
  title: LocalizedText;
  note?: LocalizedText;
  /** Narration text reserved for future TTS. */
  narration?: LocalizedText;
  /** Hold time on this chapter, seconds. */
  dwellSeconds?: number;
  overlay?: JourneyOverlay;
}

export interface Journey {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  chapters: JourneyChapter[];
  /** Cover hue used by the picker card. */
  accent?: string;
}

export interface JourneyRuntimeState {
  active: Journey | null;
  chapterIndex: number;
  /** "playing" auto-advances at dwellSeconds, "paused" waits for user. */
  status: "idle" | "playing" | "paused";
  /** Elapsed time on the current chapter (seconds). */
  elapsed: number;
}
