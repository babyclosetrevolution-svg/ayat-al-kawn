import type { Journey } from "./types";

/**
 * Seed catalogue — five flagship journeys covering scales from a single
 * planet to the deep sky. Every focus id matches an existing FocusRegistry
 * entry; nothing here introduces new astronomical objects.
 */
export const JOURNEYS: Journey[] = [
  {
    id: "earth-to-edge",
    title: { en: "From Earth to the Edge of the Solar System", fr: "De la Terre aux confins du Système solaire" },
    summary: {
      en: "A graceful flight outward from our home planet to the dwarf world of Pluto.",
      fr: "Un vol depuis la Terre jusqu'à Pluton, aux confins du Système solaire.",
    },
    accent: "#4f9dff",
    chapters: [
      { id: "earth", focus: "earth", title: { en: "Earth — the blue marble" }, dwellSeconds: 10 },
      { id: "moon", focus: "moon", title: { en: "The Moon — our companion" }, dwellSeconds: 8 },
      { id: "mars", focus: "mars", title: { en: "Mars — the red world" }, dwellSeconds: 10 },
      { id: "jupiter", focus: "jupiter", title: { en: "Jupiter — king of planets" }, dwellSeconds: 10 },
      { id: "saturn", focus: "saturn", title: { en: "Saturn — the ringed jewel" }, dwellSeconds: 10 },
      { id: "neptune", focus: "neptune", title: { en: "Neptune — the wind giant" }, dwellSeconds: 10 },
    ],
  },
  {
    id: "life-of-a-star",
    title: { en: "The Life of a Star" },
    summary: { en: "From a glowing nursery to a brilliant end — the cosmic biography of stars." },
    accent: "#ffb061",
    chapters: [
      { id: "sun", focus: "sun", title: { en: "The Sun — a middle-aged dwarf" }, dwellSeconds: 10 },
      { id: "betelgeuse", focus: "betelgeuse", title: { en: "Betelgeuse — a red supergiant" }, dwellSeconds: 10 },
      { id: "sirius", focus: "sirius", title: { en: "Sirius — bright neighbour" }, dwellSeconds: 8 },
    ],
  },
  {
    id: "scale-of-universe",
    title: { en: "The Scale of the Universe" },
    summary: { en: "Visualise sizes from a moon to a galaxy through comparative overlays." },
    accent: "#9d7bff",
    chapters: [
      {
        id: "rocky",
        focus: "earth",
        title: { en: "Rocky worlds, side by side" },
        overlay: { kind: "comparison", ids: ["mercury", "mars", "earth", "venus"], comparisonKind: "diameter" },
        dwellSeconds: 12,
      },
      {
        id: "giants",
        focus: "jupiter",
        title: { en: "Gas giants in scale" },
        overlay: { kind: "comparison", ids: ["earth", "neptune", "saturn", "jupiter"], comparisonKind: "diameter" },
        dwellSeconds: 12,
      },
      {
        id: "star-vs-planet",
        focus: "sun",
        title: { en: "A planet beside its star" },
        overlay: { kind: "comparison", ids: ["jupiter", "sun"], comparisonKind: "diameter" },
        dwellSeconds: 12,
      },
    ],
  },
  {
    id: "milky-way",
    title: { en: "Exploring the Milky Way" },
    summary: { en: "Drift through our home galaxy — from the local Sun to luminous neighbours." },
    accent: "#5cf2c2",
    chapters: [
      { id: "sun", focus: "sun", title: { en: "Our local star" }, dwellSeconds: 8 },
      { id: "milky-way", focus: "milky-way", title: { en: "The Milky Way — a barred spiral" }, dwellSeconds: 12 },
    ],
  },
  {
    id: "deep-sky",
    title: { en: "Deep Sky Wonders" },
    summary: { en: "Beyond the Milky Way — galaxies, nebulae and clusters that shape the universe." },
    accent: "#ff7eb6",
    chapters: [
      { id: "andromeda", focus: "andromeda", title: { en: "Andromeda — our nearest large galaxy" }, dwellSeconds: 10 },
      { id: "orion-nebula", focus: "orion-nebula", title: { en: "The Orion Nebula — a stellar nursery" }, dwellSeconds: 10 },
      { id: "pleiades", focus: "pleiades", title: { en: "Pleiades — a young open cluster" }, dwellSeconds: 10 },
    ],
  },
];

export function getJourney(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}
