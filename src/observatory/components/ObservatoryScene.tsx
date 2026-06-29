import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { DEG, julianDay } from "../astro/time";
import { equatorialToHorizontal, horizontalToUnitVector } from "../astro/coords";
import { sunPosition } from "../astro/sun";
import { moonPosition, moonInfo } from "../astro/moon";
import { planetPositions } from "../astro/planets";
import { CONSTELLATIONS } from "../data/constellations";
import { useObservatoryState } from "../useObservatoryState";

/**
 * ObservatoryScene — geocentric celestial sphere.
 *
 * Origin is the observer; +Y is zenith, +Z is north, +X is east. Every
 * visible body (Sun, Moon, planets, stars of registered constellations)
 * sits at a fixed scene radius so directions, not distances, are what
 * the user reads.
 */
const SKY_RADIUS = 50;

function magnitudeToSize(mag: number, scale = 1): number {
  // Brighter (smaller magnitude) → larger sprite.
  const m = Math.max(-2, Math.min(7, mag));
  return Math.max(0.18, (1.4 - 0.18 * m)) * scale;
}

function magnitudeToOpacity(mag: number): number {
  const m = Math.max(-2, Math.min(7, mag));
  return Math.max(0.35, 1 - m * 0.1);
}

interface PlacedBody {
  id: string;
  name: string;
  color: string;
  position: THREE.Vector3;
  altitude: number;
  size: number;
  opacity: number;
  isLuminary?: "sun" | "moon";
}

function projectEquatorial(
  raHours: number,
  decDeg: number,
  lat: number,
  lon: number,
  jd: number,
): { pos: THREE.Vector3; altitude: number; azimuth: number } {
  const h = equatorialToHorizontal({ raHours, decDegrees: decDeg }, lat, lon, jd);
  const v = horizontalToUnitVector(h);
  return {
    pos: new THREE.Vector3(v[0] * SKY_RADIUS, v[1] * SKY_RADIUS, v[2] * SKY_RADIUS),
    altitude: h.altitudeDegrees,
    azimuth: h.azimuthDegrees,
  };
}

function Horizon() {
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    const N = 128;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      arr.push(new THREE.Vector3(Math.sin(a) * SKY_RADIUS, 0, Math.cos(a) * SKY_RADIUS));
    }
    return arr;
  }, []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints(points);
    return g;
  }, [points]);
  return (
    <line frustumCulled={false}>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial color="#7aa7ff" transparent opacity={0.55} />
    </line>
  );
}

function CardinalLabels() {
  const labels: { text: string; pos: [number, number, number] }[] = [
    { text: "N", pos: [0, 1, SKY_RADIUS * 1.02] },
    { text: "E", pos: [SKY_RADIUS * 1.02, 1, 0] },
    { text: "S", pos: [0, 1, -SKY_RADIUS * 1.02] },
    { text: "W", pos: [-SKY_RADIUS * 1.02, 1, 0] },
  ];
  return (
    <>
      {labels.map((l) => (
        <Html key={l.text} position={l.pos} center distanceFactor={70}>
          <span className="select-none text-[10px] font-medium tracking-[0.3em] text-white/55">
            {l.text}
          </span>
        </Html>
      ))}
    </>
  );
}

function AzimuthalGrid() {
  const lines = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    // Altitude rings (every 30°)
    for (const alt of [30, 60]) {
      const pts: THREE.Vector3[] = [];
      const r = Math.cos(alt * DEG) * SKY_RADIUS;
      const y = Math.sin(alt * DEG) * SKY_RADIUS;
      const N = 96;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      geos.push(g);
    }
    // Azimuth meridians (every 45°)
    for (let az = 0; az < 360; az += 45) {
      const pts: THREE.Vector3[] = [];
      const N = 48;
      for (let i = 0; i <= N; i++) {
        const alt = (i / N) * 90;
        const r = Math.cos(alt * DEG) * SKY_RADIUS;
        const y = Math.sin(alt * DEG) * SKY_RADIUS;
        pts.push(new THREE.Vector3(Math.sin(az * DEG) * r, y, Math.cos(az * DEG) * r));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      geos.push(g);
    }
    return geos;
  }, []);
  return (
    <group>
      {lines.map((g, i) => (
        <line key={i} frustumCulled={false}>
          <primitive object={g} attach="geometry" />
          <lineBasicMaterial color="#3a6c9c" transparent opacity={0.22} />
        </line>
      ))}
    </group>
  );
}

function EquatorialGrid({
  lat, lon, jd,
}: { lat: number; lon: number; jd: number }) {
  const lines = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    // Declination parallels every 30°
    for (const dec of [-60, -30, 0, 30, 60]) {
      const pts: THREE.Vector3[] = [];
      const N = 192;
      for (let i = 0; i <= N; i++) {
        const ra = (i / N) * 24;
        const p = projectEquatorial(ra, dec, lat, lon, jd);
        pts.push(p.pos);
      }
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    // Right-ascension meridians every 3h
    for (let ra = 0; ra < 24; ra += 3) {
      const pts: THREE.Vector3[] = [];
      const N = 96;
      for (let i = 0; i <= N; i++) {
        const dec = -89 + (i / N) * 178;
        const p = projectEquatorial(ra, dec, lat, lon, jd);
        pts.push(p.pos);
      }
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return geos;
  }, [lat, lon, jd]);
  return (
    <group>
      {lines.map((g, i) => (
        <line key={i} frustumCulled={false}>
          <primitive object={g} attach="geometry" />
          <lineBasicMaterial color="#a565d8" transparent opacity={0.22} />
        </line>
      ))}
    </group>
  );
}

function ConstellationLayer({
  lat, lon, jd, showLines, showLabels,
}: { lat: number; lon: number; jd: number; showLines: boolean; showLabels: boolean }) {
  const data = useMemo(() => {
    return CONSTELLATIONS.map((c) => {
      const projected = c.stars.map((s) =>
        projectEquatorial(s.raHours, s.decDegrees, lat, lon, jd),
      );
      const visibleStars = projected.filter((p) => p.altitude > -10);
      // Constellation considered visible when at least one star is above horizon.
      const visible = projected.some((p) => p.altitude > 0);
      const centroid = new THREE.Vector3();
      for (const p of projected) centroid.add(p.pos);
      centroid.multiplyScalar(1 / Math.max(1, projected.length));
      return { c, projected, visibleStars, visible, centroid };
    });
  }, [lat, lon, jd]);

  const lineGeoms = useMemo(() => {
    return data.map(({ c, projected }) => {
      const pts: THREE.Vector3[] = [];
      for (const [a, b] of c.lines) {
        const A = projected[a]?.pos;
        const B = projected[b]?.pos;
        if (A && B) { pts.push(A, B); }
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    });
  }, [data]);

  return (
    <group>
      {/* Stars */}
      {data.flatMap(({ c, projected }) =>
        projected.map((p, i) => {
          if (p.altitude < -5) return null;
          const star = c.stars[i];
          const size = magnitudeToSize(star.magnitude, 0.6);
          const opacity = magnitudeToOpacity(star.magnitude);
          return (
            <sprite key={`${c.id}-${i}`} position={p.pos} scale={[size, size, 1]}>
              <spriteMaterial
                color="#ffffff"
                transparent
                opacity={opacity}
                depthWrite={false}
                toneMapped={false}
              />
            </sprite>
          );
        }),
      )}
      {/* Lines */}
      {showLines && lineGeoms.map((g, i) => (
        <line key={i} frustumCulled={false}>
          <primitive object={g} attach="geometry" />
          <lineBasicMaterial color="#5fb8ff" transparent opacity={0.28} />
        </line>
      ))}
      {/* Labels */}
      {showLabels && data.map(({ c, centroid, visible }) =>
        visible ? (
          <Html key={c.id} position={[centroid.x, centroid.y, centroid.z]} center distanceFactor={90}>
            <span className="pointer-events-none select-none rounded bg-black/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.25em] text-sky-200/70 backdrop-blur-sm">
              {c.name}
            </span>
          </Html>
        ) : null,
      )}
    </group>
  );
}

function Luminary({ body }: { body: PlacedBody }) {
  const isSun = body.isLuminary === "sun";
  const isMoon = body.isLuminary === "moon";
  const baseSize = isSun ? 1.8 : isMoon ? 1.5 : body.size;
  return (
    <group position={body.position}>
      {/* Outer glow */}
      <sprite scale={[baseSize * 4, baseSize * 4, 1]}>
        <spriteMaterial
          color={body.color}
          transparent
          opacity={isSun ? 0.45 : isMoon ? 0.25 : 0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[baseSize, baseSize, 1]}>
        <spriteMaterial
          color={body.color}
          transparent
          opacity={body.opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <Html position={[0, baseSize * 0.9, 0]} center distanceFactor={70}>
        <span className="pointer-events-none select-none rounded bg-black/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.25em] text-white/75 backdrop-blur-sm">
          {body.name}
        </span>
      </Html>
    </group>
  );
}

function SkyContents() {
  const s = useObservatoryState();
  const jd = useMemo(() => julianDay(s.date), [s.date]);
  const lat = s.location.latitude;
  const lon = s.location.longitude;

  const bodies: PlacedBody[] = useMemo(() => {
    const out: PlacedBody[] = [];
    // Sun
    const sun = sunPosition(jd);
    {
      const p = projectEquatorial(
        sun.equatorial.raHours, sun.equatorial.decDegrees, lat, lon, jd,
      );
      out.push({
        id: "sun", name: "Sun", color: "#ffd166",
        position: p.pos, altitude: p.altitude,
        size: 1.5, opacity: 1, isLuminary: "sun",
      });
    }
    // Moon
    {
      const m = moonPosition(jd);
      const p = projectEquatorial(m.equatorial.raHours, m.equatorial.decDegrees, lat, lon, jd);
      const info = moonInfo(jd);
      out.push({
        id: "moon",
        name: `Moon (${(info.illuminatedFraction * 100).toFixed(0)}%)`,
        color: "#e6e6f5",
        position: p.pos, altitude: p.altitude,
        size: 1.2, opacity: 1, isLuminary: "moon",
      });
    }
    // Planets
    for (const pl of planetPositions(jd)) {
      const p = projectEquatorial(pl.equatorial.raHours, pl.equatorial.decDegrees, lat, lon, jd);
      out.push({
        id: pl.id, name: pl.name, color: pl.color,
        position: p.pos, altitude: p.altitude,
        size: magnitudeToSize(pl.magnitude, 0.9),
        opacity: magnitudeToOpacity(pl.magnitude),
      });
    }
    return out;
  }, [jd, lat, lon]);

  const isDay = useMemo(() => {
    const sun = sunPosition(jd);
    const h = equatorialToHorizontal(sun.equatorial, lat, lon, jd);
    return h.altitudeDegrees > -6;
  }, [jd, lat, lon]);

  return (
    <>
      <color attach="background" args={[isDay ? "#0a2238" : "#02050f"]} />
      <ambientLight intensity={0.6} />
      <Horizon />
      <CardinalLabels />
      {s.showAzimuthalGrid && <AzimuthalGrid />}
      {s.showEquatorialGrid && <EquatorialGrid lat={lat} lon={lon} jd={jd} />}
      <ConstellationLayer
        lat={lat} lon={lon} jd={jd}
        showLines={s.showConstellationLines}
        showLabels={s.showConstellationLabels}
      />
      {bodies.map((b) => (
        <Luminary key={b.id} body={b} />
      ))}
    </>
  );
}

export function ObservatoryScene() {
  return (
    <Canvas camera={{ position: [0, 6, 0.01], fov: 70, near: 0.1, far: 200 }}>
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={0.1}
        maxDistance={SKY_RADIUS * 0.9}
        target={[0, 5, 0]}
        rotateSpeed={-0.5}
      />
      <SkyContents />
    </Canvas>
  );
}
