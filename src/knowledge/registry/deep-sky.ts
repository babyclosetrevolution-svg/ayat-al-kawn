import type { KnowledgeEntry } from "../types/KnowledgeEntry";
import { DEEP_SKY_CATALOG } from "../../data/deep-sky";

/**
 * Deep Sky knowledge — auto-derived from the deep-sky catalog.
 *
 * Editing a catalog entry automatically updates its info panel; per-object
 * descriptive copy already lives in the catalog itself, so no parallel
 * narrative file is required.
 */
const KIND_LABEL: Record<string, string> = {
  "galaxy": "Galaxy",
  "nebula": "Nebula",
  "star-cluster": "Star Cluster",
  "globular-cluster": "Globular Cluster",
  "open-cluster": "Open Cluster",
  "supernova-remnant": "Supernova Remnant",
};

const KIND_CATEGORY: Record<string, KnowledgeEntry["category"]> = {
  "galaxy": "galaxy",
  "nebula": "nebula",
  "star-cluster": "other",
  "globular-cluster": "other",
  "open-cluster": "other",
  "supernova-remnant": "other",
};

export const DEEP_SKY_KNOWLEDGE: KnowledgeEntry[] = DEEP_SKY_CATALOG.map((b) => {
  const d = b.deepSky;
  const quickFacts = [
    d.catalogNumber && { label: "Catalog", value: d.catalogNumber },
    d.constellation && { label: "Constellation", value: d.constellation },
    d.distanceLightYears && {
      label: "Distance",
      value: d.distanceLightYears.toLocaleString(),
      unit: "ly",
    },
    d.diameterLightYears && {
      label: "Diameter",
      value: d.diameterLightYears.toLocaleString(),
      unit: "ly",
    },
    typeof d.apparentMagnitude === "number" && {
      label: "Apparent mag.",
      value: d.apparentMagnitude.toString(),
    },
  ].filter(Boolean) as { label: string; value: string; unit?: string }[];

  const physical = [
    { label: "Type", value: KIND_LABEL[d.kind] ?? d.kind },
    d.distanceLightYears && {
      label: "Distance from Earth",
      value: `${d.distanceLightYears.toLocaleString()} ly`,
    },
    d.diameterLightYears && {
      label: "Apparent diameter",
      value: `${d.diameterLightYears.toLocaleString()} ly`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return {
    id: b.id,
    title: b.name,
    subtitle: KIND_LABEL[d.kind],
    category: KIND_CATEGORY[d.kind] ?? "other",
    overview: b.description,
    quickFacts,
    physicalProperties: physical,
    interestingFacts: d.discovery ? [d.discovery] : undefined,
    references: d.references && d.references.length > 0 ? d.references : undefined,
  };
});
