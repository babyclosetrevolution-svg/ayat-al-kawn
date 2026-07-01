import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * BeaconField — luminous navigation beacons positioned in deep space.
 * Each beacon is a tiny additive sprite-like sphere that pulses subtly.
 * The "active" beacon glows brighter to guide the Observer.
 */

export interface BeaconSpec {
  position: THREE.Vector3;
  /** Color in linear sRGB. */
  color: THREE.Color;
}

export function makeBeacons(): BeaconSpec[] {
  // Hand-placed positions form a gentle arc the user can intuit as a path.
  const palette = [
    new THREE.Color("#ffffff"),
    new THREE.Color("#a7c7ff"),
    new THREE.Color("#ffd7a3"),
    new THREE.Color("#c2b1ff"),
    new THREE.Color("#ffe4a8"),
  ];
  const positions: [number, number, number][] = [
    [40, 4, -120],
    [-80, -10, -260],
    [120, 24, -400],
    [-40, -6, -560],
    [0, 0, -780],
  ];
  return positions.map((p, i) => ({
    position: new THREE.Vector3(...p),
    color: palette[i % palette.length],
  }));
}

export function BeaconField({
  beacons,
  activeIndex,
}: {
  beacons: BeaconSpec[];
  activeIndex: number;
}) {
  const coreRefs = useRef<Array<THREE.Mesh | null>>([]);
  const mats = useMemo(
    () =>
      beacons.map(
        (b) =>
          new THREE.MeshBasicMaterial({
            color: b.color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
    [beacons],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < beacons.length; i++) {
      const mesh = coreRefs.current[i];
      const m = mats[i];
      if (!mesh || !m) continue;
      const isActive = i === activeIndex;
      const pulse = 0.65 + Math.sin(t * 1.3 + i * 1.7) * 0.18;
      mesh.scale.setScalar((isActive ? 1.7 : 1) * pulse);
      m.opacity = isActive ? 0.95 : 0.55;
    }
  });

  return (
    <group>
      {beacons.map((b, i) => (
        <mesh
          key={`core-${i}`}
          ref={(el) => {
            coreRefs.current[i] = el;
          }}
          position={b.position}
          material={mats[i]}
        >
          <sphereGeometry args={[1.2, 16, 16]} />
        </mesh>
      ))}
      {beacons.map((b, i) => (
        <mesh key={`halo-${i}`} position={b.position}>
          <sphereGeometry args={[4.5, 16, 16]} />
          <meshBasicMaterial
            color={b.color}
            transparent
            opacity={i === activeIndex ? 0.22 : 0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
