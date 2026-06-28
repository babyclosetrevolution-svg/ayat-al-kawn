import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { PlanetMaterial } from "../materials/PlanetMaterial";
import { AtmosphereLayer } from "../components/AtmosphereLayer";
import { CloudLayer } from "../components/CloudLayer";
import { RingLayer } from "../components/RingLayer";
import { OrbitLine } from "../components/OrbitLine";
import { Moon } from "./Moon";
import { useOrbit, useRotation } from "../../sim";

/**
 * Planet — generic solid body. Supports two placement modes:
 *
 *  - `orbit` defined → an orbital pivot rooted at the parent (the Sun) carries
 *    the planet around, and `useOrbit` drives the angular motion.
 *  - `orbit` undefined → static position (legacy / root anchor).
 *
 * Axial rotation flows through the simulation layer; live world-space
 * position is published to the FocusRegistry so the camera can track.
 */
interface Props {
  data: CelestialBodyData;
  moons?: CelestialBodyData[];
  starPosition: THREE.Vector3;
}

export function Planet({ data, moons = [], starPosition }: Props) {
  const pivotRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const hasOrbit = Boolean(data.orbit);
  const orbitDistance = data.orbit?.distance ?? 0;
  const orbitInclination = ((data.orbit?.inclination ?? 0) * Math.PI) / 180;
  const orbitPhase = data.orbit?.phase ?? 0;
  const tilt = ((data.axialTilt ?? 0) * Math.PI) / 180;

  const staticPos = useMemo(
    () => new THREE.Vector3(...(data.position ?? [0, 0, 0])),
    [data],
  );

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: hasOrbit ? new THREE.Vector3() : staticPos.clone(),
      distance: data.radius * (data.focusDistanceFactor ?? 4),
    });
  }, [data, hasOrbit, staticPos]);

  useOrbit(pivotRef, {
    parentId: data.orbit?.parentId ?? "",
    radius: orbitDistance,
    period: data.orbit?.period ?? 0,
    phase: orbitPhase,
    inclination: data.orbit?.inclination,
    enabled: hasOrbit,
  });

  useRotation(meshRef, { period: data.rotationPeriod });

  // Publish live world-space position to the camera focus registry.
  useFrame(() => {
    if (bodyRef.current) {
      const rec = FocusRegistry.get(data.id);
      if (rec) bodyRef.current.getWorldPosition(rec.position);
    }
  });

  // Root anchor: orbiting planets pivot about the star; static ones sit at their world pos.
  const anchor = hasOrbit ? starPosition : staticPos;
  const bodyOffset: [number, number, number] = hasOrbit
    ? [orbitDistance, 0, 0]
    : [0, 0, 0];

  return (
    <group position={anchor}>
      {hasOrbit && (
        <OrbitLine
          radius={orbitDistance}
          inclination={data.orbit?.inclination}
          color="#9bbcff"
          opacity={0.16}
        />
      )}
      <group ref={pivotRef} rotation={[orbitInclination, orbitPhase, 0]}>
        <group ref={bodyRef} position={bodyOffset} rotation={[0, 0, tilt]}>
          <mesh
            ref={meshRef}
            userData={{ focusKey: data.id }}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[data.radius, 96, 96]} />
            <PlanetMaterial material={data.material} textures={data.textures} />
          </mesh>
          {data.clouds && <CloudLayer radius={data.radius} clouds={data.clouds} />}
          {data.atmosphere && (
            <AtmosphereLayer
              radius={data.radius}
              atmosphere={data.atmosphere}
              sunPosition={starPosition}
            />
          )}
          {data.rings && <RingLayer rings={data.rings} />}
          {moons.map((m) => (
            <Moon key={m.id} data={m} />
          ))}
        </group>
      </group>
    </group>
  );
}
