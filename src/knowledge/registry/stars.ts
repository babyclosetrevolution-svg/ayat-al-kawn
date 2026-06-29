import type { KnowledgeEntry } from "../types/KnowledgeEntry";
import { STELLAR_NEIGHBORHOOD } from "../../data/stars/catalog";

/**
 * Stellar knowledge — Phase 9.
 *
 * One knowledge entry per stellar neighborhood entry. Most facts are
 * derived directly from the catalog so editing a star's physical data
 * automatically updates its info panel; per-star narrative copy is the
 * only thing kept here as plain text.
 */

interface StellarBlurb {
  overview: string;
  scientific?: string;
  interesting?: string[];
}

const BLURBS: Record<string, StellarBlurb> = {
  "proxima-centauri": {
    overview:
      "Proxima Centauri is the closest known star to the Sun and the faint third member of the Alpha Centauri system. A small, cool red dwarf, it hosts at least three confirmed planets — including Proxima b, an Earth-mass world in the habitable zone.",
    scientific:
      "Despite its tiny size, Proxima frequently emits powerful stellar flares that can outshine the entire star at ultraviolet wavelengths, posing a challenge for habitability around its planets.",
    interesting: [
      "Light from Proxima takes about 4.24 years to reach Earth.",
      "Its expected main-sequence lifetime is on the order of 4 trillion years.",
    ],
  },
  "alpha-centauri-a": {
    overview:
      "Alpha Centauri A is the brighter, Sun-like primary of the closest stellar system to our own. With nearly the Sun's mass and a similar spectral class, it remains the most accessible analog of our star.",
    scientific:
      "α Cen A orbits its companion α Cen B with a period of about 79.9 years and a highly elliptical orbit ranging from 11 to 36 AU.",
  },
  "alpha-centauri-b": {
    overview:
      "Alpha Centauri B is the K-type companion of α Centauri A, slightly cooler and dimmer than the Sun but markedly more chromospherically active.",
  },
  sirius: {
    overview:
      "Sirius is the brightest star in Earth's night sky. A hot A-type main-sequence star, it forms a binary with the white-dwarf remnant Sirius B, the first white dwarf ever discovered.",
    interesting: [
      "Sirius is roughly 25 times more luminous than the Sun.",
      "Ancient Egyptians timed the flooding of the Nile by the heliacal rising of Sirius.",
    ],
  },
  vega: {
    overview:
      "Vega is the fifth-brightest star in the night sky and historically defined zero magnitude in photometric systems. A rapid rotator viewed nearly pole-on, it is surrounded by a debris disk that hinted at extrasolar planetary systems decades before exoplanet detections.",
  },
  arcturus: {
    overview:
      "Arcturus is an orange giant in the constellation Boötes — the brightest star in the northern celestial hemisphere and the fourth-brightest in the entire sky.",
    scientific:
      "Its high proper motion suggests it belongs to an older stellar population, perhaps the thick disk of the Milky Way.",
  },
  polaris: {
    overview:
      "Polaris is currently aligned within about 0.7° of the north celestial pole, making it the modern North Star. It is a yellow supergiant Cepheid variable in a triple-star system.",
  },
  betelgeuse: {
    overview:
      "Betelgeuse is a red supergiant marking Orion's shoulder. Its enormous size — close to the orbit of Jupiter if placed at the Sun — and brightness variations have made it one of the most studied stars in the sky.",
    interesting: [
      "Betelgeuse is expected to end its life in a Type II supernova within the next 100,000 years.",
      "Its 2019–2020 'Great Dimming' was caused by a massive dust ejection.",
    ],
  },
  rigel: {
    overview:
      "Rigel is a brilliant blue supergiant marking the foot of Orion, intrinsically one of the most luminous stars visible to the naked eye.",
  },
};

export const STELLAR_KNOWLEDGE: KnowledgeEntry[] = STELLAR_NEIGHBORHOOD.map((s) => {
  const sci = s.science!;
  const blurb = BLURBS[s.id];
  const quickFacts = [
    sci.spectralClass && { label: "Type", value: sci.spectralClass },
    sci.effectiveTemperatureK && {
      label: "Temperature",
      value: sci.effectiveTemperatureK.toLocaleString(),
      unit: "K",
    },
    sci.luminositySuns !== undefined && {
      label: "Luminosity",
      value: sci.luminositySuns < 1
        ? sci.luminositySuns.toFixed(4)
        : sci.luminositySuns.toLocaleString(),
      unit: "L☉",
    },
    sci.distanceLightYears && {
      label: "Distance",
      value: sci.distanceLightYears.toString(),
      unit: "ly",
    },
  ].filter(Boolean) as { label: string; value: string; unit?: string }[];

  const physical = [
    sci.massSuns !== undefined && { label: "Mass", value: `${sci.massSuns} M☉` },
    sci.radiusSuns !== undefined && { label: "Radius", value: `${sci.radiusSuns} R☉` },
    sci.constellation && { label: "Constellation", value: sci.constellation },
    sci.distanceParsecs && { label: "Distance", value: `${sci.distanceParsecs} pc` },
  ].filter(Boolean) as { label: string; value: string }[];

  return {
    id: s.id,
    title: s.name,
    subtitle: sci.spectralClass
      ? `${sci.spectralClass}${sci.constellation ? ` · ${sci.constellation}` : ""}`
      : sci.constellation,
    category: "star",
    overview: blurb?.overview ?? s.description,
    quickFacts,
    scientificDescription: blurb?.scientific,
    physicalProperties: physical,
    interestingFacts: blurb?.interesting,
  };
});
