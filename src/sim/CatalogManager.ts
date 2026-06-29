/**
 * CatalogManager — loads and caches astronomical datasets on demand.
 *
 * Today only `solar-system` is registered. The same API will host stars,
 * galaxies, nebulae, missions, and exoplanets in later phases — each one
 * is just a registered loader returning its own typed records.
 *
 *   CatalogManager.register("stars", async () => fetchAndParseStars())
 *   const stars = await CatalogManager.load("stars")
 */

import type { CelestialBodyData } from "../world/types/CelestialBody";
import { SOLAR_SYSTEM_BODIES } from "../data/solar-system/bodies";
import { STELLAR_NEIGHBORHOOD } from "../data/stars/catalog";

export type CatalogId =
  | "solar-system"
  | "stars"
  | "galaxies"
  | "nebulae"
  | "missions"
  | "exoplanets";

// Per-catalog type map. Add new catalogs here as they come online.
export interface CatalogTypeMap {
  "solar-system": CelestialBodyData[];
  stars: CelestialBodyData[];
  galaxies: unknown[];
  nebulae: unknown[];
  missions: unknown[];
  exoplanets: unknown[];
}

type Loader<K extends CatalogId> = () => Promise<CatalogTypeMap[K]>;

class CatalogManagerImpl {
  private loaders = new Map<CatalogId, Loader<CatalogId>>();
  private cache = new Map<CatalogId, unknown>();
  private inflight = new Map<CatalogId, Promise<unknown>>();

  register<K extends CatalogId>(id: K, loader: Loader<K>): void {
    this.loaders.set(id, loader as Loader<CatalogId>);
  }

  async load<K extends CatalogId>(id: K): Promise<CatalogTypeMap[K]> {
    if (this.cache.has(id)) return this.cache.get(id) as CatalogTypeMap[K];
    const pending = this.inflight.get(id);
    if (pending) return pending as Promise<CatalogTypeMap[K]>;
    const loader = this.loaders.get(id);
    if (!loader) throw new Error(`CatalogManager: no loader for "${id}"`);
    const p = loader().then((data) => {
      this.cache.set(id, data);
      this.inflight.delete(id);
      return data;
    });
    this.inflight.set(id, p);
    return p as Promise<CatalogTypeMap[K]>;
  }

  /** Synchronous accessor for already-loaded catalogs. */
  get<K extends CatalogId>(id: K): CatalogTypeMap[K] | undefined {
    return this.cache.get(id) as CatalogTypeMap[K] | undefined;
  }

  isLoaded(id: CatalogId): boolean {
    return this.cache.has(id);
  }
}

export const CatalogManager = new CatalogManagerImpl();

// ── Default registrations ────────────────────────────────────────────────
// Static dataset for now; will become an async fetch when the catalog
// grows beyond what fits in a TypeScript module.
CatalogManager.register("solar-system", async () => SOLAR_SYSTEM_BODIES);
CatalogManager.register("stars", async () => STELLAR_NEIGHBORHOOD);
