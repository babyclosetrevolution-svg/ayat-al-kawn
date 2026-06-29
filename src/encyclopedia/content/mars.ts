import type { EncyclopediaContent } from "../types";

const content: EncyclopediaContent = {
  id: "mars",
  article: [
    {
      id: "overview",
      title: { en: "Overview" },
      markdown: {
        en: `**Mars** — the fourth planet from the Sun — is a cold desert world with a thin CO₂ atmosphere. It hosts the tallest volcano (*Olympus Mons*) and the longest canyon (*Valles Marineris*) known in the Solar System.

Mars is the most explored body beyond Earth: dozens of orbiters, landers and rovers have mapped its surface, sampled its atmosphere, and even flown the first powered helicopter on another world.`,
      },
    },
    {
      id: "habitability",
      title: { en: "Past habitability" },
      markdown: {
        en: `Rovers have confirmed that **liquid water** once flowed on the Martian surface. Ancient lakebeds, river deltas and hydrated minerals all point to a wetter, warmer Mars billions of years ago — a leading target in the search for past life.`,
      },
    },
  ],
  timeline: [
    { year: 1965, title: { en: "Mariner 4 — first Mars flyby" }, category: "Mission" },
    { year: 1976, title: { en: "Viking 1 & 2 — first successful landers" }, category: "Mission" },
    { year: 2012, title: { en: "Curiosity touches down in Gale Crater" }, category: "Mission" },
    { year: 2021, title: { en: "Perseverance lands; Ingenuity flies" }, category: "Mission" },
  ],
  facts: [
    { en: "A Martian day (sol) lasts ~24 hours 37 minutes." },
    { en: "Olympus Mons is roughly 22 km tall — nearly three times Mount Everest." },
  ],
  related: [
    { id: "earth" },
    { id: "phobos" },
    { id: "deimos" },
  ],
  sources: [
    { title: { en: "NASA — Mars Exploration" }, url: "https://mars.nasa.gov/", source: "NASA" },
  ],
};

export default content;
