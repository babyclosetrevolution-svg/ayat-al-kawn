import type { Topic } from "../types";

/**
 * Scientific topics — first-class data entities. They appear in the
 * Discovery panel but do not focus the camera (no scene representation).
 */
export const TOPICS: Topic[] = [
  // Stellar
  { id: "topic:fusion", title: "Nuclear Fusion", category: "Stellar physics", summary: "How stars convert hydrogen into helium and release light." },
  { id: "topic:solar-wind", title: "Solar Wind", category: "Heliophysics", summary: "Charged particles streaming outward from the Sun." },
  { id: "topic:sunspots", title: "Sunspots", category: "Heliophysics", summary: "Cooler magnetic regions on the Sun's photosphere." },
  { id: "topic:main-sequence", title: "Main Sequence Stars", category: "Stellar evolution", summary: "Stars fusing hydrogen in their core — the longest phase of stellar life." },
  { id: "topic:habitable-zone", title: "Habitable Zone", category: "Astrobiology", summary: "Orbital region where liquid water can persist on a planet's surface." },

  // Terrestrial
  { id: "topic:atmosphere", title: "Atmosphere", category: "Planetary science", summary: "Gaseous envelope shaping climate and shielding the surface." },
  { id: "topic:plate-tectonics", title: "Plate Tectonics", category: "Geology", summary: "Slow movement of crustal plates reshaping continents." },
  { id: "topic:magnetosphere", title: "Magnetosphere", category: "Planetary science", summary: "Magnetic shield that deflects solar wind." },
  { id: "topic:dust-storms", title: "Martian Dust Storms", category: "Planetary weather", summary: "Planet-encircling storms that can last for months." },
  { id: "topic:olympus-mons", title: "Olympus Mons", category: "Geology", summary: "The tallest known volcano in the Solar System." },
  { id: "topic:polar-caps", title: "Polar Ice Caps", category: "Cryosphere", summary: "Seasonal CO₂ and water ice deposits at planetary poles." },

  // Gas giants & moons
  { id: "topic:great-red-spot", title: "Great Red Spot", category: "Atmospheric science", summary: "A centuries-old anticyclonic storm on Jupiter." },
  { id: "topic:ring-systems", title: "Planetary Rings", category: "Planetary science", summary: "Disks of ice and rock orbiting giant planets." },
  { id: "topic:subsurface-ocean", title: "Subsurface Oceans", category: "Astrobiology", summary: "Liquid water hidden beneath icy moon shells." },

  // Cosmology / structure
  { id: "topic:solar-system", title: "The Solar System", category: "Cosmography", summary: "Sun, planets, moons and the broader heliosphere." },
  { id: "topic:scale", title: "The Scale of the Universe", category: "Cosmography", summary: "Distances from kilometers to light-years to megaparsecs." },
  { id: "topic:galactic-structure", title: "Galactic Structure", category: "Galactic astronomy", summary: "Disks, arms, bulges and haloes of spiral galaxies." },

  // Deep sky
  { id: "topic:deep-sky", title: "Deep Sky Objects", category: "Observational astronomy", summary: "Galaxies, nebulae, and clusters beyond the Solar System." },
  { id: "topic:nebulae", title: "Nebulae", category: "Interstellar medium", summary: "Clouds of gas and dust where stars are born — and where they die." },
  { id: "topic:star-clusters", title: "Star Clusters", category: "Stellar populations", summary: "Gravitationally bound families of stars — open and globular." },
  { id: "topic:stellar-death", title: "Stellar Death", category: "Stellar evolution", summary: "Supernovae, planetary nebulae, and the remnants stars leave behind." },
];

export const TOPIC_INDEX: Map<string, Topic> = new Map(
  TOPICS.map((t) => [t.id, t]),
);
