import type { KnowledgeEntry } from "../types/KnowledgeEntry";

/**
 * Solar-system knowledge entries.
 *
 * Educational content lives here, fully separated from the celestial body
 * dataset used by the rendering engine. The two share only the `id` string.
 */

const SUN: KnowledgeEntry = {
  id: "sun",
  title: "The Sun",
  subtitle: "G-type main-sequence star",
  category: "star",
  overview:
    "The Sun is the star at the center of the Solar System. A nearly perfect ball of hot plasma, it accounts for about 99.86% of the system's mass and is the dominant source of energy for life on Earth.",
  quickFacts: [
    { label: "Type", value: "G2V" },
    { label: "Radius", value: "695,700", unit: "km" },
    { label: "Surface temp.", value: "5,772", unit: "K" },
    { label: "Age", value: "4.6", unit: "Gyr" },
  ],
  scientificDescription:
    "The Sun fuses about 600 million tons of hydrogen into helium every second in its core, releasing energy that takes ~170,000 years to reach the surface as photons. Its outer layers — photosphere, chromosphere and corona — extend the influence of the star through the heliosphere out to beyond the Kuiper Belt.",
  physicalProperties: [
    { label: "Mass", value: "1.989 × 10³⁰ kg" },
    { label: "Surface gravity", value: "274 m/s²" },
    { label: "Rotation period", value: "~25 days (equator)" },
    { label: "Luminosity", value: "3.828 × 10²⁶ W" },
  ],
  internalStructure: {
    summary:
      "From the core outward: nuclear-fusing core, radiative zone, convective zone, photosphere, chromosphere and corona.",
    layers: [
      { label: "Core", value: "~15.7 million K, fusion engine" },
      { label: "Radiative zone", value: "Energy diffuses outward via photons" },
      { label: "Convective zone", value: "Plasma convection drives granulation" },
      { label: "Photosphere", value: "Visible surface, ~5,772 K" },
      { label: "Corona", value: "Tenuous outer atmosphere, > 1 MK" },
    ],
  },
  interestingFacts: [
    "Light from the Sun reaches Earth in about 8 minutes and 20 seconds.",
    "The solar wind shapes a vast bubble — the heliosphere — that surrounds the entire Solar System.",
  ],
  references: [
    { title: "NASA — Sun Fact Sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html", source: "NASA" },
  ],
};

const MERCURY: KnowledgeEntry = {
  id: "mercury",
  title: "Mercury",
  subtitle: "Innermost planet",
  category: "planet",
  overview:
    "Mercury is the smallest planet in the Solar System and the closest to the Sun. With almost no atmosphere, its surface preserves a record of impacts spanning billions of years.",
  quickFacts: [
    { label: "Radius", value: "2,439.7", unit: "km" },
    { label: "Gravity", value: "3.7", unit: "m/s²" },
    { label: "Temp.", value: "100 – 700", unit: "K" },
    { label: "Year", value: "88", unit: "days" },
  ],
  scientificDescription:
    "Mercury has a tenuous exosphere of atoms blasted off its surface by the solar wind and micrometeoroid impacts. Its 3:2 spin–orbit resonance means a solar day lasts about 176 Earth days. The planet has a surprisingly large iron core — about 60% of its mass.",
  physicalProperties: [
    { label: "Mass", value: "3.30 × 10²³ kg" },
    { label: "Orbital period", value: "87.97 days" },
    { label: "Rotation period", value: "58.6 days (sidereal)" },
    { label: "Semi-major axis", value: "0.387 AU" },
  ],
  surface: {
    summary:
      "Heavily cratered, with extensive smooth plains formed by ancient volcanism and the gigantic Caldoris Basin.",
  },
  interestingFacts: [
    "Despite being closest to the Sun, Mercury is not the hottest planet — Venus is.",
    "Polar craters in permanent shadow contain water ice.",
  ],
  references: [{ title: "NASA — Mercury", url: "https://science.nasa.gov/mercury/", source: "NASA" }],
};

const VENUS: KnowledgeEntry = {
  id: "venus",
  title: "Venus",
  subtitle: "Earth's hostile twin",
  category: "planet",
  overview:
    "Venus is similar to Earth in size and composition but utterly different at the surface: a runaway greenhouse effect creates the hottest surface in the Solar System.",
  quickFacts: [
    { label: "Radius", value: "6,051.8", unit: "km" },
    { label: "Surface temp.", value: "737", unit: "K" },
    { label: "Atmosphere", value: "96.5% CO₂" },
    { label: "Day", value: "243", unit: "Earth days" },
  ],
  scientificDescription:
    "Venus rotates retrograde and so slowly that a Venusian day is longer than its year. Its dense atmosphere produces a surface pressure ~92 times Earth's. Sulfuric-acid clouds blanket the planet in reflective haze, making it the brightest object in our sky after the Sun and Moon.",
  atmosphere: {
    summary: "Crushing CO₂ atmosphere with reflective sulfuric-acid clouds.",
    composition: [
      { label: "Carbon dioxide", value: "96.5%" },
      { label: "Nitrogen", value: "3.5%" },
      { label: "Sulfur dioxide", value: "trace" },
    ],
  },
  interestingFacts: [
    "A day on Venus is longer than its year.",
    "Surface pressure equals being ~900 m underwater on Earth.",
  ],
  references: [{ title: "NASA — Venus", url: "https://science.nasa.gov/venus/", source: "NASA" }],
};

const EARTH: KnowledgeEntry = {
  id: "earth",
  title: "Earth",
  subtitle: "The pale blue dot",
  category: "planet",
  overview:
    "Earth is the only known world that harbors life. Liquid water covers ~71% of its surface, and a magnetic field shields its atmosphere and biosphere from the solar wind.",
  quickFacts: [
    { label: "Radius", value: "6,378", unit: "km" },
    { label: "Gravity", value: "9.807", unit: "m/s²" },
    { label: "Mean temp.", value: "288", unit: "K" },
    { label: "Year", value: "365.256", unit: "days" },
  ],
  scientificDescription:
    "Earth's layered interior — solid inner core, liquid outer core, mantle and crust — drives plate tectonics, volcanism, and a self-sustaining geodynamo. Atmospheric circulation, ocean currents and the carbon cycle stabilize the climate within a narrow habitable range.",
  physicalProperties: [
    { label: "Mass", value: "5.972 × 10²⁴ kg" },
    { label: "Axial tilt", value: "23.44°" },
    { label: "Rotation period", value: "23h 56m 4s" },
    { label: "Semi-major axis", value: "1 AU" },
  ],
  atmosphere: {
    summary: "Nitrogen–oxygen atmosphere with trace greenhouse gases.",
    composition: [
      { label: "Nitrogen", value: "78.08%" },
      { label: "Oxygen", value: "20.95%" },
      { label: "Argon", value: "0.93%" },
      { label: "CO₂", value: "~0.04%" },
    ],
  },
  internalStructure: {
    layers: [
      { label: "Inner core", value: "Solid iron–nickel, ~5,400 K" },
      { label: "Outer core", value: "Liquid metal, generates the magnetic field" },
      { label: "Mantle", value: "Silicate rock, slowly convects" },
      { label: "Crust", value: "Rigid plates, oceanic + continental" },
    ],
  },
  satellites: [{ name: "Moon", note: "Stabilizes Earth's axial tilt." }],
  interestingFacts: [
    "Earth is the densest planet in the Solar System.",
    "The Moon is unusually large relative to its planet, likely formed from a giant impact.",
  ],
  references: [{ title: "NASA — Earth", url: "https://science.nasa.gov/earth/", source: "NASA" }],
};

const MOON: KnowledgeEntry = {
  id: "moon",
  title: "The Moon",
  subtitle: "Earth's natural satellite",
  category: "moon",
  overview:
    "The Moon is Earth's only natural satellite, tidally locked so that one hemisphere always faces home. It stabilizes Earth's axis and drives the tides.",
  quickFacts: [
    { label: "Radius", value: "1,737.4", unit: "km" },
    { label: "Gravity", value: "1.62", unit: "m/s²" },
    { label: "Distance", value: "384,400", unit: "km" },
    { label: "Orbit", value: "27.32", unit: "days" },
  ],
  scientificDescription:
    "The Moon likely formed from debris ejected when a Mars-sized body struck the early Earth. Its surface is divided between bright highlands and darker basalt plains (maria) formed by ancient lava flows.",
  exploration: {
    summary: "The only world beyond Earth visited by humans.",
    timeline: [
      { year: 1959, mission: "Luna 2", agency: "USSR", note: "First spacecraft to reach the Moon." },
      { year: 1969, mission: "Apollo 11", agency: "NASA", note: "First crewed landing." },
      { year: 2023, mission: "Chandrayaan-3", agency: "ISRO", note: "First soft landing near the south pole." },
    ],
  },
  interestingFacts: [
    "The Moon is slowly drifting away from Earth at about 3.8 cm per year.",
    "Its far side was first photographed by Luna 3 in 1959.",
  ],
  references: [{ title: "NASA — Moon", url: "https://science.nasa.gov/moon/", source: "NASA" }],
};

const MARS: KnowledgeEntry = {
  id: "mars",
  title: "Mars",
  subtitle: "The Red Planet",
  category: "planet",
  overview:
    "Mars is a cold desert world with a thin atmosphere, polar ice caps, towering volcanoes and vast canyons. It is the most explored planet beyond Earth.",
  quickFacts: [
    { label: "Radius", value: "3,389.5", unit: "km" },
    { label: "Gravity", value: "3.71", unit: "m/s²" },
    { label: "Day", value: "24.6", unit: "hours" },
    { label: "Year", value: "687", unit: "days" },
  ],
  scientificDescription:
    "Mars hosts Olympus Mons, the tallest known volcano in the Solar System, and Valles Marineris, a canyon system thousands of kilometers long. Ancient riverbeds and minerals point to a wetter past.",
  satellites: [
    { name: "Phobos", note: "Slowly spiraling inward; will eventually break apart." },
    { name: "Deimos", note: "Tiny outer moon, likely a captured asteroid." },
  ],
  exploration: {
    summary: "Decades of orbiters, landers and rovers.",
    timeline: [
      { year: 1976, mission: "Viking 1 & 2", agency: "NASA" },
      { year: 2012, mission: "Curiosity", agency: "NASA" },
      { year: 2021, mission: "Perseverance & Ingenuity", agency: "NASA" },
    ],
  },
  interestingFacts: ["Olympus Mons rises ~22 km above the Martian datum — nearly three times Everest."],
  references: [{ title: "NASA — Mars", url: "https://science.nasa.gov/mars/", source: "NASA" }],
};

const JUPITER: KnowledgeEntry = {
  id: "jupiter",
  title: "Jupiter",
  subtitle: "King of the planets",
  category: "planet",
  overview:
    "Jupiter is the largest planet in the Solar System — a gas giant more massive than all the others combined. Its banded atmosphere hosts storms that endure for centuries.",
  quickFacts: [
    { label: "Radius", value: "69,911", unit: "km" },
    { label: "Mass", value: "318", unit: "Earths" },
    { label: "Day", value: "9.93", unit: "hours" },
    { label: "Moons", value: "95+" },
  ],
  scientificDescription:
    "Jupiter is composed mostly of hydrogen and helium. Deep inside, hydrogen behaves as a liquid metal, generating the strongest planetary magnetic field in the Solar System. The Great Red Spot is a persistent anticyclone larger than Earth.",
  satellites: [
    { name: "Io", note: "Most volcanically active body in the Solar System." },
    { name: "Europa", note: "Subsurface ocean — a prime target in the search for life." },
    { name: "Ganymede", note: "Largest moon in the Solar System; has its own magnetic field." },
    { name: "Callisto", note: "Most heavily cratered surface known." },
  ],
  interestingFacts: ["Jupiter shields the inner Solar System by deflecting many comets and asteroids."],
  references: [{ title: "NASA — Jupiter", url: "https://science.nasa.gov/jupiter/", source: "NASA" }],
};

const SATURN: KnowledgeEntry = {
  id: "saturn",
  title: "Saturn",
  subtitle: "The ringed jewel",
  category: "planet",
  overview:
    "Saturn is defined by its spectacular ring system — billions of icy particles in a disk only tens of meters thick. The planet itself is a gas giant slightly smaller than Jupiter.",
  quickFacts: [
    { label: "Radius", value: "58,232", unit: "km" },
    { label: "Mass", value: "95", unit: "Earths" },
    { label: "Day", value: "10.7", unit: "hours" },
    { label: "Moons", value: "146+" },
  ],
  scientificDescription:
    "Saturn's mean density is lower than water. Its rings are made of nearly pure water ice and extend up to ~280,000 km from the planet while remaining astonishingly thin.",
  satellites: [
    { name: "Titan", note: "Thick nitrogen atmosphere and liquid-methane lakes." },
    { name: "Enceladus", note: "Geysers vent water from a subsurface ocean." },
  ],
  references: [{ title: "NASA — Saturn", url: "https://science.nasa.gov/saturn/", source: "NASA" }],
};

const URANUS: KnowledgeEntry = {
  id: "uranus",
  title: "Uranus",
  subtitle: "The sideways ice giant",
  category: "planet",
  overview:
    "Uranus is an ice giant tipped on its side, likely from a giant impact early in its history. Each pole receives 42 years of continuous sunlight, then 42 years of darkness.",
  quickFacts: [
    { label: "Radius", value: "25,362", unit: "km" },
    { label: "Tilt", value: "97.8°" },
    { label: "Year", value: "84", unit: "Earth years" },
    { label: "Moons", value: "27" },
  ],
  scientificDescription:
    "Uranus's blue-green color comes from methane in its hydrogen–helium atmosphere absorbing red light. Beneath lies an icy mantle of water, methane and ammonia surrounding a rocky core.",
  references: [{ title: "NASA — Uranus", url: "https://science.nasa.gov/uranus/", source: "NASA" }],
};

const NEPTUNE: KnowledgeEntry = {
  id: "neptune",
  title: "Neptune",
  subtitle: "Distant blue ice giant",
  category: "planet",
  overview:
    "Neptune is the outermost planet of the Solar System and the windiest, with supersonic storms tearing through its deep-blue atmosphere.",
  quickFacts: [
    { label: "Radius", value: "24,622", unit: "km" },
    { label: "Distance", value: "30.07", unit: "AU" },
    { label: "Year", value: "165", unit: "Earth years" },
    { label: "Winds", value: ">2,000", unit: "km/h" },
  ],
  scientificDescription:
    "Neptune was the first planet discovered by mathematical prediction rather than observation. Its largest moon, Triton, orbits in retrograde and is likely a captured Kuiper-belt object.",
  satellites: [{ name: "Triton", note: "Retrograde orbit; geologically active." }],
  references: [{ title: "NASA — Neptune", url: "https://science.nasa.gov/neptune/", source: "NASA" }],
};

// Minimal entries for major moons — graceful partial data demonstrates schema flexibility.
const moon = (id: string, title: string, subtitle: string, overview: string): KnowledgeEntry => ({
  id,
  title,
  subtitle,
  category: "moon",
  overview,
});

const MINOR_MOONS: KnowledgeEntry[] = [
  moon("phobos", "Phobos", "Inner moon of Mars", "Phobos is the larger, inner moon of Mars, slowly spiraling toward the planet."),
  moon("deimos", "Deimos", "Outer moon of Mars", "Deimos is the smaller, outer Martian moon, likely a captured asteroid."),
  moon("io", "Io", "Galilean moon of Jupiter", "The most volcanically active body in the Solar System, heated by tidal flexing."),
  moon("europa", "Europa", "Galilean moon of Jupiter", "An icy shell hides a global subsurface ocean — a prime target in the search for life."),
  moon("ganymede", "Ganymede", "Largest moon in the Solar System", "Ganymede is larger than Mercury and has its own intrinsic magnetic field."),
  moon("callisto", "Callisto", "Galilean moon of Jupiter", "The most heavily cratered surface known, geologically inactive."),
  moon("titan", "Titan", "Largest moon of Saturn", "Titan has a thick nitrogen atmosphere and lakes of liquid methane and ethane."),
  moon("enceladus", "Enceladus", "Ice moon of Saturn", "Geysers from its south pole vent water from a subsurface ocean."),
  moon("titania", "Titania", "Largest moon of Uranus", "Titania is an icy world marked by canyons and ancient impact craters."),
  moon("oberon", "Oberon", "Outer moon of Uranus", "The outermost major moon of Uranus, with a heavily cratered surface."),
  moon("triton", "Triton", "Largest moon of Neptune", "Triton orbits Neptune in retrograde and is likely a captured Kuiper-belt object."),
];

export const SOLAR_SYSTEM_KNOWLEDGE: KnowledgeEntry[] = [
  SUN,
  MERCURY,
  VENUS,
  EARTH,
  MOON,
  MARS,
  JUPITER,
  SATURN,
  URANUS,
  NEPTUNE,
  ...MINOR_MOONS,
];
