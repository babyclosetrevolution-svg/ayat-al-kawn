import { useEffect, useState } from "react";
import type { GalaxyData } from "../../data/galaxy/milky-way";
import { CatalogManager } from "../../sim";
import { MilkyWayGalaxy } from "../objects/MilkyWayGalaxy";

/**
 * MilkyWayScene — loads the galaxy catalog and mounts every galaxy
 * renderer. Today the catalog holds a single entry (the Milky Way) but
 * the assembler is already generic so future galaxies plug in without
 * any change here.
 */
export function MilkyWayScene() {
  const [galaxies, setGalaxies] = useState<GalaxyData[] | null>(
    (CatalogManager.get("galaxies") as GalaxyData[] | undefined) ?? null,
  );

  useEffect(() => {
    if (galaxies) return;
    let cancelled = false;
    CatalogManager.load("galaxies").then((g) => {
      if (!cancelled) setGalaxies(g as GalaxyData[]);
    });
    return () => {
      cancelled = true;
    };
  }, [galaxies]);

  if (!galaxies) return null;
  return (
    <group>
      {galaxies.map((g) => (
        <MilkyWayGalaxy key={g.id} data={g} />
      ))}
    </group>
  );
}
