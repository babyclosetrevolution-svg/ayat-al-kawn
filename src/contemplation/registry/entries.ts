import type { ContemplationEntry } from "../types";

/**
 * Seed registry — neutral, non-denominational contemplative material.
 * Strictly separated from scientific content. Categories can be toggled
 * independently by the user.
 */
export const CONTEMPLATION_ENTRIES: ContemplationEntry[] = [
  {
    id: "verse-1",
    category: "verse",
    text: {
      en: "And it is He who created the night and the day, and the sun and the moon — each in an orbit floating.",
      ar: "وَهُوَ الَّذِي خَلَقَ اللَّيْلَ وَالنَّهَارَ وَالشَّمْسَ وَالْقَمَرَ ۖ كُلٌّ فِي فَلَكٍ يَسْبَحُونَ",
    },
    source: "Qur'an 21:33",
  },
  {
    id: "verse-2",
    category: "verse",
    text: {
      en: "Do they not look at the sky above them — how We have built it and adorned it, with no flaws?",
    },
    source: "Qur'an 50:6",
  },
  {
    id: "reflection-1",
    category: "reflection",
    text: { en: "The same atoms that form distant stars also weave the eyes that perceive them." },
  },
  {
    id: "reflection-2",
    category: "reflection",
    text: { en: "Every photon you see from a star is a quiet messenger that crossed centuries to reach you." },
  },
  {
    id: "quote-1",
    category: "quotation",
    text: { en: "The heavens declare the glory of a maker; the firmament shows the work of order." },
    source: "Anonymous",
  },
  {
    id: "quote-2",
    category: "quotation",
    text: { en: "We are a way for the cosmos to know itself." },
    source: "Carl Sagan",
  },
];

class ContemplationRegistryImpl {
  private entries: ContemplationEntry[] = [...CONTEMPLATION_ENTRIES];
  register(e: ContemplationEntry) { this.entries.push(e); }
  all() { return this.entries; }
}

export const ContemplationRegistry = new ContemplationRegistryImpl();
