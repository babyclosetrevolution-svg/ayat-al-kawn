import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { PlanetMaterial } from "../materials/PlanetMaterial";
import { AtmosphereLayer } from "../components/AtmosphereLayer";
import { CloudLayer } from "../components/CloudLayer";
import { RingLayer } from "../components/RingLayer";
import { Moon } from "./Moon";

/**
 * Planet — generic solid body. Composes optional atmosphere / clouds / rings
 * and renders any attached moons inside its local frame, so a moon's parent
 * transform is "free" via the scene graph.
 */
interface Props {
  data: CelestialBodyData;
  moons?: CelestialBodyData[];
  starPosition: THREE.Vector3;
}

export function Planet({ data, moons = [], starPosition }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => new THREE.Vector3(...(data.position ?? [0, 0, 0])),
    [data],
  );
  const omega = (2 * Math.PI) / data.rotationPeriod;
  const tilt = ((data.axialTilt ?? 0) * Math.PI) / 180;

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: pos.clone(),
      distance: data.radius * (data.focusDistanceFactor ?? 4),
    });
  }, [data, pos]);

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * omega;
    if (groupRef.current) {
      const rec = FocusRegistry.get(data.id);
      if (rec) groupRef.current.getWorldPosition(rec.position);
    }
  });

  return (
    <group ref={groupRef} position={pos} rotation={[0, 0, tilt]}>
      <mesh ref={meshRef} userData={{ focusKey: data.id }} castShadow receiveShadow>
        <sphereGeometry args={[data.radius, 128, 128]} />
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
  );
}
