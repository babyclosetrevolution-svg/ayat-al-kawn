import type { EntityId, Relation, RelationKind } from "../types";

/**
 * DiscoveryGraph — bi-directional, data-driven relation store.
 *
 * Modules register edges. The graph deduplicates by (from, to, kind) and
 * exposes typed lookups so suggestion logic stays declarative. The graph
 * never reads from rendering, knowledge, or simulation engines.
 */
class DiscoveryGraphImpl {
  private outgoing = new Map<EntityId, Relation[]>();
  private edgeKey = (r: Relation) => `${r.from}::${r.to}::${r.kind}`;
  private seen = new Set<string>();

  add(rel: Relation): void {
    const key = this.edgeKey(rel);
    if (this.seen.has(key)) return;
    this.seen.add(key);
    const bucket = this.outgoing.get(rel.from);
    if (bucket) bucket.push(rel);
    else this.outgoing.set(rel.from, [rel]);
  }

  addMany(rels: Relation[]): void {
    for (const r of rels) this.add(r);
  }

  /** Add an edge in both directions with an opposite RelationKind hint. */
  link(
    a: EntityId,
    b: EntityId,
    kind: RelationKind,
    opts: { reverseKind?: RelationKind; weight?: number; reason?: string } = {},
  ): void {
    this.add({ from: a, to: b, kind, weight: opts.weight, reason: opts.reason });
    this.add({
      from: b,
      to: a,
      kind: opts.reverseKind ?? kind,
      weight: opts.weight,
      reason: opts.reason,
    });
  }

  relations(from: EntityId): Relation[] {
    return this.outgoing.get(from) ?? [];
  }

  relationsOfKind(from: EntityId, kinds: RelationKind[]): Relation[] {
    const set = new Set(kinds);
    return this.relations(from).filter((r) => set.has(r.kind));
  }
}

export const DiscoveryGraph = new DiscoveryGraphImpl();

// ─────────────────────────────────────────────────────────────────────────
// Seed relations. These describe the meaningful connections between the
// currently shipped catalogues. Adding new bodies in future phases only
// requires appending edges here.
// ─────────────────────────────────────────────────────────────────────────

const PLANETS = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
const ROCKY = ["mercury", "venus", "earth", "mars"];
const GAS_GIANTS = ["jupiter", "saturn", "uranus", "neptune"];
const STARS_NEARBY = ["proxima-centauri", "alpha-centauri-a", "alpha-centauri-b", "sirius", "vega", "arcturus"];

// Solar System hierarchy.
for (const p of PLANETS) {
  DiscoveryGraph.link("sun", p, "child", { reverseKind: "parent" });
  DiscoveryGraph.add({ from: p, to: "topic:solar-system", kind: "category" });
}
DiscoveryGraph.link("milky-way", "sun", "child", { reverseKind: "parent" });

// Same-category families.
const sameCategory = (group: string[]) => {
  for (const a of group) {
    for (const b of group) {
      if (a !== b) DiscoveryGraph.add({ from: a, to: b, kind: "similar", weight: 1 });
    }
  }
};
sameCategory(ROCKY);
sameCategory(GAS_GIANTS);
sameCategory(STARS_NEARBY);

// Moons → parents.
const MOONS: Record<string, string[]> = {
  earth: ["moon"],
  mars: ["phobos", "deimos"],
  jupiter: ["io", "europa", "ganymede", "callisto"],
  saturn: ["titan", "enceladus"],
  uranus: ["titania", "oberon"],
  neptune: ["triton"],
};
for (const [parent, moons] of Object.entries(MOONS)) {
  for (const m of moons) {
    DiscoveryGraph.link(parent, m, "satellite", { reverseKind: "parent" });
  }
  // Sibling moons.
  sameCategory(moons);
}

// Topic associations.
const topicLinks: [EntityId, EntityId, string?][] = [
  ["sun", "topic:fusion"],
  ["sun", "topic:solar-wind"],
  ["sun", "topic:sunspots"],
  ["sun", "topic:main-sequence"],
  ["sun", "topic:solar-system"],
  ["earth", "topic:atmosphere"],
  ["earth", "topic:plate-tectonics"],
  ["earth", "topic:magnetosphere"],
  ["earth", "topic:habitable-zone"],
  ["mars", "topic:dust-storms"],
  ["mars", "topic:olympus-mons"],
  ["mars", "topic:polar-caps"],
  ["mars", "topic:atmosphere"],
  ["venus", "topic:atmosphere"],
  ["jupiter", "topic:great-red-spot"],
  ["jupiter", "topic:ring-systems"],
  ["saturn", "topic:ring-systems"],
  ["europa", "topic:subsurface-ocean"],
  ["ganymede", "topic:subsurface-ocean"],
  ["enceladus", "topic:subsurface-ocean"],
  ["titan", "topic:atmosphere"],
  ["milky-way", "topic:galactic-structure"],
  ["proxima-centauri", "topic:main-sequence"],
  ["sirius", "topic:main-sequence"],
  ["neptune", "topic:scale"],
];
for (const [from, to, reason] of topicLinks) {
  DiscoveryGraph.add({ from, to, kind: "topic", reason });
}

// Cross-category bridges.
DiscoveryGraph.link("sun", "proxima-centauri", "neighbor", {
  reason: "Nearest stellar neighbor.",
});
DiscoveryGraph.link("sun", "topic:main-sequence", "category");
DiscoveryGraph.link("earth", "moon", "satellite", { reverseKind: "parent" });

// ── Deep Sky ─────────────────────────────────────────────────────────────
import { DEEP_SKY_CATALOG, DEEP_SKY_BY_KIND } from "../../data/deep-sky";

const KIND_TOPIC: Record<string, EntityId> = {
  "galaxy": "topic:galactic-structure",
  "nebula": "topic:nebulae",
  "open-cluster": "topic:star-clusters",
  "globular-cluster": "topic:star-clusters",
  "star-cluster": "topic:star-clusters",
  "supernova-remnant": "topic:stellar-death",
};

for (const b of DEEP_SKY_CATALOG) {
  DiscoveryGraph.add({ from: b.id, to: "topic:deep-sky", kind: "category" });
  const t = KIND_TOPIC[b.deepSky.kind];
  if (t) DiscoveryGraph.add({ from: b.id, to: t, kind: "topic" });
  DiscoveryGraph.add({ from: b.id, to: "topic:scale", kind: "topic" });
}
// Same-kind families.
for (const family of Object.values(DEEP_SKY_BY_KIND)) {
  const ids = family.map((b) => b.id);
  for (const a of ids) for (const c of ids) if (a !== c) {
    DiscoveryGraph.add({ from: a, to: c, kind: "similar", weight: 1 });
  }
}
// Milky Way ↔ Local Group neighbors.
for (const id of ["andromeda", "triangulum", "lmc", "smc"]) {
  DiscoveryGraph.link("milky-way", id, "neighbor", { reason: "Local Group member." });
}
