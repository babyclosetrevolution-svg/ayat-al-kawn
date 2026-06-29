import type { EncyclopediaContent } from "../types";

/**
 * Earth — example encyclopedia entry.
 *
 * Every user-facing string is a LocalizedText so translations can be
 * added per locale without touching renderers.
 */
const content: EncyclopediaContent = {
  id: "earth",
  article: [
    {
      id: "overview",
      title: { en: "Overview", fr: "Aperçu", ar: "نظرة عامة" },
      markdown: {
        en: `Earth is the **third planet from the Sun** and the only astronomical object known to harbour life. Its surface is dominated by liquid water and a thin nitrogen–oxygen atmosphere that supports a complex biosphere.

- Mean radius: **6,371 km**
- Orbital period: **365.25 days**
- One natural satellite: the *Moon*

> "The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever." — *Konstantin Tsiolkovsky*`,
        fr: `La Terre est la **troisième planète** du Système solaire et le seul objet astronomique connu à abriter la vie.`,
      },
    },
    {
      id: "formation",
      title: { en: "Formation" },
      markdown: {
        en: `Earth formed roughly **4.54 billion years ago** from the same rotating disc of gas and dust that produced the Sun and the other planets. A giant impact with a Mars-sized body is widely believed to have produced the Moon shortly thereafter.`,
      },
    },
  ],
  timeline: [
    { year: -4540000000, title: { en: "Formation of Earth" }, category: "Geology" },
    { year: -4500000000, title: { en: "Moon-forming giant impact" }, category: "Geology" },
    { year: -3500000000, title: { en: "Earliest known microbial life" }, category: "Biology" },
    { year: 1957, title: { en: "Sputnik 1 — first artificial satellite" }, category: "Spaceflight" },
    { year: 1969, title: { en: "First crewed lunar landing" }, category: "Spaceflight" },
  ],
  facts: [
    { en: "Earth is the densest planet in the Solar System." },
    { en: "About 71% of the surface is covered by oceans." },
  ],
  sources: [
    { title: { en: "NASA — Earth Fact Sheet" }, url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html", source: "NASA" },
    { title: { en: "IAU — Planetary nomenclature" }, url: "https://planetarynames.wr.usgs.gov/", source: "IAU" },
  ],
  related: [
    { id: "moon", note: { en: "Earth's only natural satellite." } },
    { id: "sun", note: { en: "The star Earth orbits." } },
    { id: "mars", note: { en: "Neighbouring rocky planet." } },
    { id: "venus", note: { en: "Earth's hot, cloud-shrouded twin." } },
  ],
};

export default content;
