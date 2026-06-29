import type { ScaleJourney } from "../types";

/**
 * Pre-authored Scale Journeys.
 *
 * Steps reference body ids already in the data layer — no new astronomical
 * content is introduced here. Add new sequences by appending to this list.
 */
export const SCALE_JOURNEYS: ScaleJourney[] = [
  {
    id: "journey:size-of-worlds",
    title: "The Size of Worlds",
    summary: "From the Moon to a red supergiant — diameter at every step.",
    kind: "diameter",
    steps: [
      { id: "moon", caption: "Our familiar starting point — Earth's only natural satellite." },
      { id: "earth", caption: "Earth is roughly four times wider than the Moon." },
      { id: "mars", caption: "Mars is about half Earth's diameter." },
      { id: "jupiter", caption: "Eleven Earths would line up across Jupiter." },
      { id: "sun", caption: "The Sun could swallow 1.3 million Earths." },
      { id: "betelgeuse", caption: "Betelgeuse dwarfs the Sun — it would reach past Jupiter's orbit." },
    ],
  },
  {
    id: "journey:rocky-trio",
    title: "Rocky Trio",
    summary: "Compare the three nearest terrestrial worlds.",
    kind: "diameter",
    steps: [
      { id: "earth" },
      { id: "venus" },
      { id: "mars" },
    ],
  },
  {
    id: "journey:gas-giants",
    title: "Among the Giants",
    summary: "Four worlds bigger than Earth.",
    kind: "diameter",
    steps: [
      { id: "earth" },
      { id: "neptune" },
      { id: "uranus" },
      { id: "saturn" },
      { id: "jupiter" },
    ],
  },
  {
    id: "journey:gravity",
    title: "Feeling Heavy",
    summary: "Surface gravity across the Solar System.",
    kind: "gravity",
    steps: [
      { id: "moon" },
      { id: "mars" },
      { id: "earth" },
      { id: "jupiter" },
      { id: "sun" },
    ],
  },
  {
    id: "journey:distance",
    title: "Stepping Outward",
    summary: "From the inner Solar System to the nearest star.",
    kind: "distance",
    steps: [
      { id: "earth" },
      { id: "mars" },
      { id: "jupiter" },
      { id: "neptune" },
      { id: "proxima-centauri" },
    ],
  },
];

export function journeyById(id: string | null) {
  if (!id) return undefined;
  return SCALE_JOURNEYS.find((j) => j.id === id);
}
