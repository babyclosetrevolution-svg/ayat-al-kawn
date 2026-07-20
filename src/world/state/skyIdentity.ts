/**
 * SkyIdentityRegistry — the authoritative "what is that light?" table.
 *
 * Every sky renderer (RealStarfield, NearStarPromoter, background
 * generator, deep-sky) registers each point it draws with a stable id
 * and a type. Discovery, Knowledge and future raycast pickers ask the
 * registry rather than guessing, guaranteeing that no visible pixel is
 * anonymous — even if the user never zooms in on it.
 */
export type SkyEntityType =
  | "star"           // catalogued real star
  | "star-system"    // resolved multiple-star / planetary system
  | "background-star" // procedural far star (deterministic, unreachable)
  | "galaxy"
  | "nebula"
  | "cluster"
  | "supernova-remnant"
  | "quasar"
  | "black-hole";

export interface SkyIdentity {
  id: string;
  type: SkyEntityType;
  /** Human-readable label (may be empty for uncatalogued background stars). */
  name?: string;
  /** Optional metadata pointer, resolved lazily by Knowledge/Discovery. */
  ref?: string;
}

class SkyIdentityRegistryImpl {
  private entries = new Map<string, SkyIdentity>();

  register(entry: SkyIdentity): void {
    this.entries.set(entry.id, entry);
  }

  registerMany(entries: Iterable<SkyIdentity>): void {
    for (const e of entries) this.entries.set(e.id, e);
  }

  get(id: string): SkyIdentity | undefined {
    return this.entries.get(id);
  }

  size(): number {
    return this.entries.size;
  }
}

export const SkyIdentityRegistry = new SkyIdentityRegistryImpl();
