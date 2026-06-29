/**
 * Cosmic Scale Engine — shared types.
 *
 * The scale layer is fully data-driven and reuses the existing rendering,
 * camera, knowledge, discovery and science engines. It never registers
 * new astronomical objects; it composes the catalogue we already ship.
 */

export type ComparisonKind =
  | "diameter"
  | "radius"
  | "mass"
  | "gravity"
  | "temperature"
  | "distance"
  | "rotation"
  | "orbit";

export interface ComparisonMetric {
  /** Raw numeric value used for proportional sizing / sorting. */
  value: number;
  /** Human-readable formatted value with unit. */
  display: string;
  /** Source unit, e.g. "km", "g/cm³", "Earth masses". */
  unit: string;
  /** True when the body has no data for the requested kind. */
  missing?: boolean;
}

export interface ScaleJourneyStep {
  /** Body id (matches FocusRegistry / KnowledgeRegistry). */
  id: string;
  /** Optional one-line caption — overrides the auto-generated context note. */
  caption?: string;
}

export interface ScaleJourney {
  id: string;
  title: string;
  summary: string;
  kind: ComparisonKind;
  steps: ScaleJourneyStep[];
}

export interface ContextCard {
  /** Headline ratio, e.g. "11× wider than Earth". */
  headline: string;
  /** Educational explanation in plain prose. */
  body: string;
}
