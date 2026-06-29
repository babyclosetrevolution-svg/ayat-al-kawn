import type { MissionData } from "./types";

/**
 * Seeded catalogue of landmark human space-exploration missions.
 *
 * Each entry is fully data-driven. Adding a new mission only requires
 * appending an object here — the Knowledge and Discovery engines pick it
 * up automatically through `src/exploration/index.ts`.
 */
export const MISSIONS: MissionData[] = [
  {
    id: "mission:apollo",
    name: "Apollo Program",
    category: "mission",
    agency: "NASA",
    launchYear: 1961,
    endYear: 1972,
    targets: ["moon", "earth"],
    relatedMissions: [],
    topics: ["topic:solar-system"],
    summary:
      "Crewed program that landed the first humans on the Moon between 1969 and 1972.",
    highlights: [
      "Apollo 11 — first crewed lunar landing (1969).",
      "Six successful crewed landings, 12 astronauts on the surface.",
      "Returned 382 kg of lunar samples that still drive lunar science today.",
    ],
    references: [
      { title: "NASA — The Apollo Program", url: "https://www.nasa.gov/specials/apollo50th/", source: "NASA" },
    ],
  },
  {
    id: "mission:voyager",
    name: "Voyager 1 & 2",
    category: "probe",
    agency: "NASA",
    launchYear: 1977,
    endYear: "active",
    targets: ["jupiter", "saturn", "uranus", "neptune", "titan"],
    relatedMissions: ["mission:cassini", "mission:galileo"],
    topics: ["topic:scale", "topic:ring-systems"],
    summary:
      "Twin interstellar probes that conducted the only flybys of all four giant planets and now travel beyond the heliopause.",
    highlights: [
      "Voyager 2 remains the only spacecraft to have visited Uranus and Neptune.",
      "Voyager 1 entered interstellar space in 2012.",
      "Both carry the Golden Record — a message to any future finders.",
    ],
    references: [
      { title: "NASA — Voyager Mission", url: "https://voyager.jpl.nasa.gov/", source: "NASA/JPL" },
    ],
  },
  {
    id: "mission:cassini",
    name: "Cassini–Huygens",
    category: "orbiter",
    agency: "NASA / ESA / ASI",
    launchYear: 1997,
    endYear: 2017,
    targets: ["saturn", "titan", "enceladus"],
    relatedMissions: ["mission:voyager", "mission:galileo"],
    topics: ["topic:ring-systems", "topic:subsurface-ocean"],
    summary:
      "Orbital tour of the Saturn system that delivered the Huygens probe to Titan and revealed Enceladus' geysers.",
    highlights: [
      "First soft landing in the outer Solar System (Huygens on Titan, 2005).",
      "Discovered water-rich plumes erupting from Enceladus.",
      "Ended with a controlled plunge into Saturn's atmosphere — the Grand Finale.",
    ],
    references: [
      { title: "NASA — Cassini", url: "https://science.nasa.gov/mission/cassini/", source: "NASA" },
    ],
  },
  {
    id: "mission:galileo",
    name: "Galileo",
    category: "orbiter",
    agency: "NASA",
    launchYear: 1989,
    endYear: 2003,
    targets: ["jupiter", "io", "europa", "ganymede", "callisto"],
    relatedMissions: ["mission:juno", "mission:voyager"],
    topics: ["topic:subsurface-ocean", "topic:great-red-spot"],
    summary:
      "First spacecraft to orbit Jupiter, providing decisive evidence for a subsurface ocean on Europa.",
    highlights: [
      "Delivered an atmospheric entry probe into Jupiter (1995).",
      "Detailed surveys of the Galilean moons.",
      "Built the case for Europa as a leading habitability target.",
    ],
  },
  {
    id: "mission:juno",
    name: "Juno",
    category: "orbiter",
    agency: "NASA",
    launchYear: 2011,
    endYear: "active",
    targets: ["jupiter", "io", "europa", "ganymede"],
    relatedMissions: ["mission:galileo"],
    topics: ["topic:great-red-spot", "topic:magnetosphere"],
    summary:
      "Polar-orbiting mission mapping Jupiter's gravity, magnetic field, and deep atmosphere.",
    highlights: [
      "Closest observations of the Great Red Spot ever recorded.",
      "Revealed cyclone clusters at Jupiter's poles.",
      "Solar-powered at record distance from the Sun.",
    ],
  },
  {
    id: "mission:curiosity",
    name: "Curiosity (MSL)",
    category: "rover",
    agency: "NASA",
    launchYear: 2011,
    endYear: "active",
    targets: ["mars"],
    relatedMissions: ["mission:perseverance"],
    topics: ["topic:dust-storms", "topic:habitable-zone"],
    summary:
      "Car-sized rover exploring Gale Crater to assess Mars' past habitability.",
    highlights: [
      "Confirmed Gale Crater once hosted a long-lived freshwater lake.",
      "Detected complex organic molecules in Martian rocks.",
      "Climbing Mount Sharp to read 3 billion years of Martian climate.",
    ],
  },
  {
    id: "mission:perseverance",
    name: "Perseverance & Ingenuity",
    category: "rover",
    agency: "NASA",
    launchYear: 2020,
    endYear: "active",
    targets: ["mars"],
    relatedMissions: ["mission:curiosity"],
    topics: ["topic:habitable-zone"],
    summary:
      "Astrobiology rover caching samples in Jezero Crater for a future return — and flying the first off-world helicopter.",
    highlights: [
      "Ingenuity completed the first powered flight on another planet (2021).",
      "MOXIE produced oxygen from Martian CO₂.",
      "Caching samples for the Mars Sample Return campaign.",
    ],
  },
  {
    id: "mission:hubble",
    name: "Hubble Space Telescope",
    category: "telescope",
    agency: "NASA / ESA",
    launchYear: 1990,
    endYear: "active",
    targets: ["earth", "milky-way", "andromeda", "orion-nebula", "pillars-of-creation", "crab-nebula"],
    relatedMissions: ["mission:jwst"],
    topics: ["topic:deep-sky", "topic:galactic-structure", "topic:scale"],
    summary:
      "Visible/UV space telescope in low-Earth orbit that reshaped modern astronomy across three decades.",
    highlights: [
      "Measured the Universe's expansion rate to within a few percent.",
      "Hubble Deep Field revealed thousands of galaxies in a tiny patch of sky.",
      "Five servicing missions kept it operating for 30+ years.",
    ],
    references: [
      { title: "NASA — Hubble", url: "https://hubblesite.org/", source: "STScI" },
    ],
  },
  {
    id: "mission:jwst",
    name: "James Webb Space Telescope",
    category: "telescope",
    agency: "NASA / ESA / CSA",
    launchYear: 2021,
    endYear: "active",
    targets: ["sun", "milky-way", "andromeda", "orion-nebula", "pillars-of-creation"],
    relatedMissions: ["mission:hubble"],
    topics: ["topic:deep-sky", "topic:nebulae", "topic:scale", "topic:galactic-structure"],
    summary:
      "Infrared space telescope at L2 designed to see the first galaxies and probe exoplanet atmospheres.",
    highlights: [
      "Largest mirror ever flown — 6.5 m segmented gold-coated beryllium.",
      "Detected some of the earliest known galaxies, just hundreds of millions of years after the Big Bang.",
      "Resolved water and CO₂ in exoplanet atmospheres.",
    ],
    references: [
      { title: "NASA — JWST", url: "https://webb.nasa.gov/", source: "NASA" },
    ],
  },
  {
    id: "mission:iss",
    name: "International Space Station",
    category: "station",
    agency: "NASA / Roscosmos / ESA / JAXA / CSA",
    launchYear: 1998,
    endYear: "active",
    targets: ["earth"],
    relatedMissions: [],
    topics: ["topic:atmosphere", "topic:magnetosphere"],
    summary:
      "Continuously crewed orbital laboratory — the largest human-built structure ever to fly in space.",
    highlights: [
      "Continuously inhabited since November 2000.",
      "Hosts hundreds of experiments in microgravity each year.",
      "Orbits Earth roughly every 90 minutes at ~400 km altitude.",
    ],
    references: [
      { title: "NASA — Space Station", url: "https://www.nasa.gov/international-space-station/", source: "NASA" },
    ],
  },
];

export const MISSIONS_BY_ID: Map<string, MissionData> = new Map(
  MISSIONS.map((m) => [m.id, m]),
);

export const MISSIONS_BY_CATEGORY: Record<string, MissionData[]> = MISSIONS.reduce(
  (acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  },
  {} as Record<string, MissionData[]>,
);
