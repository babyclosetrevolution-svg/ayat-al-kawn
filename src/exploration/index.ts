/**
 * Space Exploration Pack — registers a catalogue of human space missions
 * into the Knowledge and Discovery engines.
 *
 * Importing this module once at app start is enough: it wires everything
 * declaratively and never touches rendering or simulation.
 */
import type { KnowledgeEntry } from "../knowledge/types/KnowledgeEntry";
import { KnowledgeRegistry } from "../knowledge/registry/KnowledgeRegistry";
import { DiscoveryGraph } from "../discovery/registry/graph";
import { MISSIONS } from "./catalog";
import type { MissionCategory, MissionData } from "./types";

export type { MissionCategory, MissionData } from "./types";
export { MISSIONS, MISSIONS_BY_ID, MISSIONS_BY_CATEGORY } from "./catalog";

const CATEGORY_LABEL: Record<MissionCategory, string> = {
  "mission": "Mission",
  "rover": "Rover",
  "orbiter": "Orbiter",
  "probe": "Probe",
  "telescope": "Space Telescope",
  "station": "Space Station",
  "launch-vehicle": "Launch Vehicle",
};

function endYearLabel(end: MissionData["endYear"]): string {
  if (end === "active") return "Active";
  if (typeof end === "number") return String(end);
  return "—";
}

function toKnowledge(m: MissionData): KnowledgeEntry {
  const duration = `${m.launchYear} – ${endYearLabel(m.endYear)}`;
  return {
    id: m.id,
    title: m.name,
    subtitle: `${CATEGORY_LABEL[m.category]} · ${m.agency}`,
    // Missions are non-celestial: stay in "other" so resolveEntity
    // correctly marks them as non-navigable in the Discovery panel.
    category: "other",
    overview: m.summary,
    quickFacts: [
      { label: "Type", value: CATEGORY_LABEL[m.category] },
      { label: "Agency", value: m.agency },
      { label: "Launched", value: String(m.launchYear) },
      { label: "Status", value: endYearLabel(m.endYear) },
    ],
    physicalProperties: [
      { label: "Operational", value: duration },
      { label: "Targets", value: m.targets.length.toString() },
    ],
    interestingFacts: m.highlights,
    references: m.references,
  };
}

// ── Knowledge entries ────────────────────────────────────────────────────
KnowledgeRegistry.registerMany(MISSIONS.map(toKnowledge));

// ── Discovery graph wiring ───────────────────────────────────────────────
// Every mission links to:
//   • each celestial body it targeted (exploration relation, both ways)
//   • its sibling missions (similar)
//   • optional scientific topics
// As a result, focusing on Mars naturally surfaces Curiosity, Perseverance
// (and through them, Ingenuity-as-highlight) under "Related" / "Continue
// exploring" in the existing Discovery panel — no UI changes required.
for (const m of MISSIONS) {
  for (const target of m.targets) {
    DiscoveryGraph.link(m.id, target, "exploration", {
      reverseKind: "exploration",
      reason: `${m.name} explored this object.`,
      weight: 2,
    });
  }
  for (const related of m.relatedMissions ?? []) {
    DiscoveryGraph.add({
      from: m.id,
      to: related,
      kind: "similar",
      reason: "Related mission.",
    });
  }
  for (const topic of m.topics ?? []) {
    DiscoveryGraph.add({ from: m.id, to: topic, kind: "topic" });
  }
}

// Same-category families (rovers ↔ rovers, telescopes ↔ telescopes…).
const byCategory: Record<string, string[]> = {};
for (const m of MISSIONS) (byCategory[m.category] ??= []).push(m.id);
for (const ids of Object.values(byCategory)) {
  for (const a of ids)
    for (const b of ids)
      if (a !== b) {
        DiscoveryGraph.add({ from: a, to: b, kind: "similar", weight: 1 });
      }
}
