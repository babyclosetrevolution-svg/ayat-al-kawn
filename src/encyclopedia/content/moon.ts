import type { EncyclopediaContent } from "../types";

const content: EncyclopediaContent = {
  id: "moon",
  article: [
    {
      id: "overview",
      title: { en: "Overview" },
      markdown: {
        en: `The **Moon** is Earth's only natural satellite and the fifth-largest moon in the Solar System. Tidally locked to Earth, it always shows the same face from our vantage point.

The lunar surface preserves a near-pristine record of the inner Solar System's early bombardment history — every crater is a frozen snapshot of an impact that occurred billions of years ago.`,
      },
    },
    {
      id: "formation",
      title: { en: "Formation" },
      markdown: {
        en: `The leading theory — the **giant-impact hypothesis** — holds that a Mars-sized body struck the proto-Earth ~4.5 billion years ago. Debris from the collision coalesced in orbit to form the Moon.`,
      },
    },
  ],
  facts: [{ en: "The Moon is moving away from Earth at ~3.8 cm per year." }],
  related: [
    { id: "earth", note: { en: "The Moon's host planet." } },
    { id: "phobos", note: { en: "A much smaller, irregular moon of Mars." } },
  ],
  sources: [
    { title: { en: "NASA — Moon" }, url: "https://moon.nasa.gov/", source: "NASA" },
  ],
};

export default content;
