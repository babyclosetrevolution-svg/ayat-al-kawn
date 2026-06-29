import type { CelestialBodyData } from "../types/CelestialBody";
import { Star } from "../objects/Star";

/**
 * StellarNeighborhood — assembler for the nearby-stars catalog.
 *
 * Reuses the generic Star renderer exactly as the Solar System does;
 * each entry already carries its compressed world position so no extra
 * placement logic is needed. Adding new stars is purely a data change.
 */
export function StellarNeighborhood({ stars }: { stars: CelestialBodyData[] }) {
  return (
    <group>
      {stars.map((s) => (
        <Star key={s.id} data={s} />
      ))}
    </group>
  );
}
