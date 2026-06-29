import type { LocalizedText } from "../encyclopedia/types";

/**
 * Contemplation Mode — shared types.
 *
 * This module is intentionally separate from every scientific layer so
 * verses, reflections and quotations never mix with educational content
 * unless the user chooses to enable each category.
 */

export type ContemplationCategory = "verse" | "reflection" | "quotation";

export interface ContemplationEntry {
  id: string;
  category: ContemplationCategory;
  text: LocalizedText;
  /** Source attribution (book, chapter, author). */
  source?: string;
}

export interface ContemplationSettings {
  active: boolean;
  enabled: Record<ContemplationCategory, boolean>;
  /** Seconds between content rotations. */
  rotationSeconds: number;
}
