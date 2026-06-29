/**
 * Space Exploration — shared types.
 *
 * Every mission, spacecraft, telescope, station or launch vehicle is a
 * data-only entity. The id is namespaced with `mission:` so the Discovery
 * Engine and Knowledge Registry can resolve them without colliding with
 * celestial body ids.
 */

export type MissionCategory =
  | "mission"
  | "rover"
  | "orbiter"
  | "probe"
  | "telescope"
  | "station"
  | "launch-vehicle";

export interface MissionReference {
  title: string;
  url?: string;
  source?: string;
}

export interface MissionData {
  /** Always prefixed with `mission:` to keep the id space distinct. */
  id: string;
  name: string;
  category: MissionCategory;
  agency: string;
  launchYear: number;
  endYear?: number | "active";
  /** Celestial body ids this mission visited, observed, or targeted. */
  targets: string[];
  /** Other missions this one is naturally read with. */
  relatedMissions?: string[];
  /** Topics from the Discovery Engine (e.g. `topic:atmosphere`). */
  topics?: string[];
  summary: string;
  highlights?: string[];
  references?: MissionReference[];
}
