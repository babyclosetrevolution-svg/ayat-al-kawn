import { useMemo } from "react";
import * as THREE from "three";
import { julianDay } from "../../observatory/astro/time";
import { equatorialToHorizontal, horizontalToUnitVector } from "../../observatory/astro/coords";
import { sunPosition } from "../../observatory/astro/sun";
import { moonPosition, moonInfo } from "../../observatory/astro/moon";
import { planetPositions } from "../../observatory/astro/planets";
import { CONSTELLATIONS } from "../../observatory/data/constellations";
import { getSoftGlowTexture } from "../objects/deepsky/glowTexture";

/**
 * RealSky — projects the true naked-eye sky (Sun, Moon, planets, named
 * stars from the constellation catalog) onto a celestial shell above
 * the Observer standing on Earth.
 *
 * The Observer sits at (0, +Y, 0) in SurfaceScene: local zenith = +Y,
 * north = +Z, east = +X — the same convention used by
 * horizontalToUnitVector. Positions are computed from real ephemerides
 * for the current wall-clock instant and a default observer location.
 */

// Default observer: Mecca (astronomically meaningful, mid-latitude).
const DEFAULT_LAT = 21.4225;
const DEFAULT_LON = 39.8262;

// Radius of the celestial shell in scene units. Must sit below the
// shared Starfield sphere (~900) so real bodies read in front of the
// procedural star dust and Milky-Way band, and above the Earth
// surface (EARTH_RADIUS 380 in SurfaceScene).
const SKY = 780;

interface Placed {
  id: string;
  name: string;
  color: string;
  pos: THREE.Vector3;
  altitude: number;
  size: number;
  opacity: number;
  kind: "sun" | "moon" | "planet" | "star";
}

function project(raH: number, decD: number, lat: number, lon: number, jd: number) {
  const h = equatorialToHorizontal({ raHours: raH, decDegrees: decD }, lat, lon, jd);
  const v = horizontalToUnitVector(h);
  return {
    pos: new THREE.Vector3(v[0] * SKY, v[1] * SKY, v[2] * SKY),
    altitude: h.altitudeDegrees,
  };
}

function magSize(mag: number, base: number): number {
  const m = Math.max(-2, Math.min(6, mag));
  return Math.max(0.4, base * (1.6 - 0.22 * m));
}
function magOpacity(mag: number): number {
  const m = Math.max(-2, Math.min(6, mag));
  return Math.max(0.35, 1 - m * 0.11);
}

export function RealSky() {
  const glow = getSoftGlowTexture();

  const bodies = useMemo<Placed[]>(() => {
    const jd = julianDay(new Date());
    const lat = DEFAULT_LAT;
    const lon = DEFAULT_LON;
    const out: Placed[] = [];

    // Sun
    {
      const s = sunPosition(jd);
      const p = project(s.equatorial.raHours, s.equatorial.decDegrees, lat, lon, jd);
      out.push({
        id: "sun", name: "Sun", color: "#ffd28a",
        pos: p.pos, altitude: p.altitude,
        size: 22, opacity: 1, kind: "sun",
      });
    }
    // Moon
    {
      const m = moonPosition(jd);
      const info = moonInfo(jd);
      const p = project(m.equatorial.raHours, m.equatorial.decDegrees, lat, lon, jd);
      out.push({
        id: "moon",
        name: `Moon · ${(info.illuminatedFraction * 100).toFixed(0)}%`,
        color: "#e8e6f0",
        pos: p.pos, altitude: p.altitude,
        size: 18, opacity: 0.95, kind: "moon",
      });
    }
    // Planets
    for (const pl of planetPositions(jd)) {
      const p = project(pl.equatorial.raHours, pl.equatorial.decDegrees, lat, lon, jd);
      out.push({
        id: pl.id, name: pl.name, color: pl.color,
        pos: p.pos, altitude: p.altitude,
        size: magSize(pl.magnitude, 5.2),
        opacity: magOpacity(pl.magnitude),
        kind: "planet",
      });
    }
    // Named stars (constellation catalog)
    for (const c of CONSTELLATIONS) {
      for (let i = 0; i < c.stars.length; i++) {
        const st = c.stars[i];
        const p = project(st.raHours, st.decDegrees, lat, lon, jd);
        out.push({
          id: `${c.id}-${i}`,
          name: st.name ?? "",
          color: "#ffffff",
          pos: p.pos, altitude: p.altitude,
          size: magSize(st.magnitude, 3.4),
          opacity: magOpacity(st.magnitude) * 0.9,
          kind: "star",
        });
      }
    }
    return out;
  }, []);

  if (!glow) return null;

  return (
    <group renderOrder={-1}>
      {bodies.map((b) => {
        // Cull bodies clearly below the horizon (small negative margin
        // to keep grazing risings visible through the atmospheric limb).
        if (b.altitude < -2) return null;
        const opacity =
          b.altitude < 3
            ? b.opacity * Math.max(0, (b.altitude + 2) / 5)
            : b.opacity;
        return (
          <group key={b.id} position={b.pos}>
            {(b.kind === "sun" || b.kind === "moon" || b.kind === "planet") && (
              <sprite scale={[b.size * 3.2, b.size * 3.2, 1]}>
                <spriteMaterial
                  map={glow}
                  color={b.color}
                  transparent
                  opacity={opacity * (b.kind === "sun" ? 0.6 : 0.35)}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  toneMapped={false}
                />
              </sprite>
            )}
            <sprite scale={[b.size, b.size, 1]}>
              <spriteMaterial
                map={glow}
                color={b.color}
                transparent
                opacity={opacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </sprite>
          </group>
        );
      })}
    </group>
  );
}
