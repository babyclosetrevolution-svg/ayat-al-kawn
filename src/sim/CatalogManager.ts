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
import { GALAXY_CATALOG, type GalaxyData } from "../data/galaxy/milky-way";
import { DEEP_SKY_CATALOG } from "../data/deep-sky";
import type { DeepSkyBodyData } from "../data/deep-sky";

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
  galaxies: GalaxyData[];
  nebulae: unknown[];
  missions: unknown[];
  exoplanets: unknown[];
}


type Loader<K extends CatalogId> = () => Promise<CatalogTypeMap[K]>;
type RegionLoader<K extends CatalogId> = (
  regionId: string,
) => Promise<CatalogTypeMap[K]>;

class CatalogManagerImpl {
  private loaders = new Map<CatalogId, Loader<CatalogId>>();
  private regionLoaders = new Map<CatalogId, RegionLoader<CatalogId>>();
  private cache = new Map<CatalogId, unknown>();
  private regionCache = new Map<string, unknown>(); // key: `${id}::${region}`
  private inflight = new Map<CatalogId, Promise<unknown>>();
  private listeners = new Set<() => void>();

  register<K extends CatalogId>(id: K, loader: Loader<K>): void {
    this.loaders.set(id, loader as Loader<CatalogId>);
  }

  /**
   * Optional region-aware loader. Catalogs that don't define one fall
   * back to returning the entire dataset for any region id, which is
   * fine while datasets fit comfortably in memory.
   */
  registerRegionLoader<K extends CatalogId>(
    id: K,
    loader: RegionLoader<K>,
  ): void {
    this.regionLoaders.set(id, loader as RegionLoader<CatalogId>);
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
      for (const cb of this.listeners) cb();
      return data;
    });
    this.inflight.set(id, p);
    return p as Promise<CatalogTypeMap[K]>;
  }

  /** Region-scoped load. Falls back to the full catalog when no region loader exists. */
  async loadRegion<K extends CatalogId>(
    id: K,
    regionId: string,
  ): Promise<CatalogTypeMap[K]> {
    const key = `${id}::${regionId}`;
    if (this.regionCache.has(key))
      return this.regionCache.get(key) as CatalogTypeMap[K];
    const rl = this.regionLoaders.get(id);
    const data = rl
      ? ((await rl(regionId)) as CatalogTypeMap[K])
      : await this.load(id);
    this.regionCache.set(key, data);
    return data;
  }

  /** Synchronous accessor for already-loaded catalogs. */
  get<K extends CatalogId>(id: K): CatalogTypeMap[K] | undefined {
    return this.cache.get(id) as CatalogTypeMap[K] | undefined;
  }

  isLoaded(id: CatalogId): boolean {
    return this.cache.has(id);
  }

  loadedCount(): number {
    return this.cache.size;
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}


export const CatalogManager = new CatalogManagerImpl();

// ── Default registrations ────────────────────────────────────────────────
// Static dataset for now; will become an async fetch when the catalog
// grows beyond what fits in a TypeScript module.
CatalogManager.register("solar-system", async () => SOLAR_SYSTEM_BODIES);
CatalogManager.register("stars", async () => STELLAR_NEIGHBORHOOD);
CatalogManager.register("galaxies", async () => GALAXY_CATALOG);
