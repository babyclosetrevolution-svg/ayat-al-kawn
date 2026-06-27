import { useMemo } from "react";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { Star } from "../objects/Star";
import { Planet } from "../objects/Planet";

/**
 * SolarSystem — data-driven assembler. Walks the body list, instantiates
 * each typed renderer, and nests moons inside their parent planet so the
 * scene graph carries orbit transforms for free.
 */
export function SolarSystem({ bodies }: { bodies: CelestialBodyData[] }) {
  const { star, planets, moonsByParent } = useMemo(() => {
    const star = bodies.find((b) => b.type === "star");
    const planets = bodies.filter((b) => b.type === "planet");
    const moonsByParent = new Map<string, CelestialBodyData[]>();
    for (const m of bodies.filter((b) => b.type === "moon")) {
      const p = m.orbit?.parentId ?? "";
      if (!moonsByParent.has(p)) moonsByParent.set(p, []);
      moonsByParent.get(p)!.push(m);
    }
    return { star, planets, moonsByParent };
  }, [bodies]);

  if (!star) return null;
  const starPos = new THREE.Vector3(...(star.position ?? [0, 0, 0]));

  return (
    <group>
      <Star data={star} />
      {planets.map((p) => (
        <Planet
          key={p.id}
          data={p}
          moons={moonsByParent.get(p.id) ?? []}
          starPosition={starPos}
        />
      ))}
    </group>
  );
}
