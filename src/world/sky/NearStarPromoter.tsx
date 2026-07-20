import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadHygCatalog, type SkyStar } from "../../data/stars/hyg";
import { STELLAR_NEIGHBORHOOD } from "../../data/stars/catalog";
import { Star } from "../objects/Star";
import type { CelestialBodyData } from "../types/CelestialBody";
import { SkyIdentityRegistry } from "../state/skyIdentity";

/**
 * NearStarPromoter — LOD promoter for the HYG buffer.
 *
 * Every ~250 ms it re-scans the catalog for stars closer than
 * `promotionRadius` scene units to the camera (or to the currently
 * focused body). Those stars are mounted as real `<Star>` meshes so
 * the user can approach them, see the corona, and eventually reach
 * their surface — while the same id in `RealStarfield` continues to
 * hold its coordinate. Because both share the same position, the
 * transition is continuous: a distant light grows into a sun.
 *
 * Stars already hand-curated in `STELLAR_NEIGHBORHOOD` are skipped
 * (they carry richer science data and are always mounted).
 */
const PROMOTION_RADIUS = 320; // scene units — well beyond flight comfort
const CHECK_INTERVAL = 0.25;  // seconds

export function NearStarPromoter() {
  const catalog = useMemo(() => loadHygCatalog(), []);
  const curatedIds = useMemo(
    () => new Set(STELLAR_NEIGHBORHOOD.map((s) => s.id)),
    [],
  );

  const { camera } = useThree();
  const [nearIds, setNearIds] = useState<string[]>([]);
  const lastCheck = useRef(0);
  const camPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - lastCheck.current < CHECK_INTERVAL) return;
    lastCheck.current = now;
    camera.getWorldPosition(camPos.current);
    const rSq = PROMOTION_RADIUS * PROMOTION_RADIUS;
    const next: string[] = [];
    for (const s of catalog) {
      if (curatedIds.has(s.id)) continue;
      const dx = s.position[0] - camPos.current.x;
      const dy = s.position[1] - camPos.current.y;
      const dz = s.position[2] - camPos.current.z;
      if (dx * dx + dy * dy + dz * dz <= rSq) next.push(s.id);
    }
    // Cheap change detection — avoid re-render when set is stable.
    setNearIds((prev) =>
      prev.length === next.length && prev.every((id, i) => id === next[i])
        ? prev
        : next,
    );
  });

  const byId = useMemo(() => {
    const m = new Map<string, SkyStar>();
    for (const s of catalog) m.set(s.id, s);
    return m;
  }, [catalog]);

  return (
    <group>
      {nearIds.map((id) => {
        const s = byId.get(id);
        if (!s) return null;
        const body = skyStarToBody(s);
        // Re-register as a system entity — a light we're now standing
        // close enough to inhabit as a real place.
        SkyIdentityRegistry.register({
          id: body.id,
          type: "star-system",
          name: body.name,
        });
        return <Star key={id} data={body} />;
      })}
    </group>
  );
}

/**
 * Derive a minimal, physically-plausible `CelestialBodyData` from a HYG
 * entry so the shared `<Star>` renderer works with no branching.
 */
function skyStarToBody(s: SkyStar): CelestialBodyData {
  // Radius derived from magnitude (brighter = larger presence when
  // reached). Bounded so no supergiant fills the entire frame.
  const bright = Math.max(0.5, 6.8 - s.mag);
  const radius = THREE.MathUtils.clamp(0.35 + bright * 0.22, 0.35, 3.2);
  const displayName = s.name || s.bayer || `HIP ${s.hip || s.id}`;
  return {
    id: s.id,
    name: displayName,
    type: "star",
    radius,
    rotationPeriod: 600,
    position: s.position,
    focusDistanceFactor: 6,
    description: s.constellation
      ? `${displayName} — ${s.constellation}, ${s.parsecs.toFixed(1)} pc.`
      : displayName,
    science: {
      classification: s.spectralClass,
      spectralClass: s.spectralClass,
      effectiveTemperatureK: s.temperatureK,
      distanceParsecs: s.parsecs,
      distanceLightYears: +(s.parsecs * 3.2615637769).toFixed(3),
      constellation: s.constellation || undefined,
    },
  };
}
