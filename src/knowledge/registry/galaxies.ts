import type { KnowledgeEntry } from "../types/KnowledgeEntry";
import { GALAXY_CATALOG } from "../../data/galaxy/milky-way";

/**
 * Galactic knowledge — Phase 11.
 *
 * Each registered galaxy emits one entry. The Knowledge Engine is
 * generic so the same shape used for stars and planets carries here.
 */
export const GALACTIC_KNOWLEDGE: KnowledgeEntry[] = GALAXY_CATALOG.map((g) => {
  const sci = g.science ?? {};
  const quickFacts = [
    sci.classificationDetail && { label: "Type", value: g.classification },
    sci.diameterLightYears && {
      label: "Diameter",
      value: sci.diameterLightYears.toLocaleString(),
      unit: "ly",
    },
    sci.starCountEstimate && {
      label: "Stars",
      value: sci.starCountEstimate,
    },
    sci.ageBillionYears && {
      label: "Age",
      value: sci.ageBillionYears.toString(),
      unit: "Gyr",
    },
  ].filter(Boolean) as { label: string; value: string; unit?: string }[];

  const physical = [
    sci.massSolarMasses && {
      label: "Mass",
      value: `${sci.massSolarMasses.toExponential(1)} M☉`,
    },
    { label: "Spiral arms", value: g.arms.length.toString() },
    { label: "Notable regions", value: g.regions.length.toString() },
  ].filter(Boolean) as { label: string; value: string }[];

  return {
    id: g.id,
    title: g.name,
    subtitle: g.classification,
    category: "galaxy",
    overview: g.description,
    quickFacts,
    scientificDescription:
      "The Milky Way is a barred spiral galaxy hosting the Solar System in the Orion Spur, a minor arm fragment between the Sagittarius and Perseus arms. Its supermassive black hole, Sagittarius A*, anchors the dense central bulge.",
    physicalProperties: physical,
    interestingFacts: [
      "Light takes roughly 100,000 years to cross the galactic disk from edge to edge.",
      "The Sun completes one orbit around the galactic center every ~225 million years.",
      "Most of the galaxy's mass is invisible — dominated by a halo of dark matter.",
    ],
  };
});
