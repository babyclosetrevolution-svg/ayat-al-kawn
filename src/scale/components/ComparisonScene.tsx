import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CelestialBodyData } from "../../world/types/CelestialBody";
import type { ComparisonKind } from "../types";
import { metricFor } from "../engine/metrics";

/**
 * Comparison scene — a small, isolated R3F canvas dedicated to side-by-side
 * proportional spheres. It deliberately does NOT mount the main world tree:
 *
 *  - Same camera (a single PerspectiveCamera fit to the row).
 *  - Same lighting (one key light, gentle fill).
 *  - Same orientation (every sphere rotates about +Y).
 *  - Synchronized rotation (shared angular velocity).
 *  - Animated scaling (lerp from 0 / from the previous radius).
 *
 * Materials are pulled from each body's `material` / `emissive` descriptor
 * so colors match what the user sees in the live Universe — without paying
 * the cost of full texture loading inside the modal.
 */

interface SceneProps {
  bodies: CelestialBodyData[];
  kind: ComparisonKind;
}

const MIN_RATIO = 0.03;
const GAP = 0.4;
const BASE_RADIUS = 2.2;

function computeRadii(bodies: CelestialBodyData[], kind: ComparisonKind): number[] {
  if (bodies.length === 0) return [];
  const values = bodies.map((b) => {
    const m = metricFor(b, kind);
    return m.missing ? 0 : Math.max(m.value, 0);
  });
  const max = Math.max(...values, 1e-9);
  return values.map((v) => {
    if (v <= 0) return BASE_RADIUS * MIN_RATIO * 0.5;
    const ratio = v / max;
    return BASE_RADIUS * Math.max(ratio, MIN_RATIO);
  });
}

function layoutOffsets(radii: number[]): { offsets: number[]; totalWidth: number } {
  const offsets: number[] = [];
  let x = 0;
  for (let i = 0; i < radii.length; i++) {
    if (i === 0) x = radii[0];
    else x += radii[i - 1] + GAP + radii[i];
    offsets.push(x);
  }
  const totalWidth = x + (radii[radii.length - 1] ?? 0);
  return { offsets, totalWidth };
}

/** Pick a hex color for each body (planets via material, stars via emissive). */
function colorFor(body: CelestialBodyData): { base: string; emissive: string | null } {
  if (body.type === "star") {
    return {
      base: body.emissive?.color ?? "#ffd97a",
      emissive: body.emissive?.color ?? "#ffb347",
    };
  }
  const c = body.material?.color ?? body.atmosphere?.color ?? "#9aa6b2";
  return { base: c, emissive: null };
}

function SphereBody({
  body,
  targetRadius,
  x,
  omega,
}: {
  body: CelestialBodyData;
  targetRadius: number;
  x: number;
  omega: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const labelY = useRef(0);
  const scaleRef = useRef(0);
  const xRef = useRef(x);
  const groupRef = useRef<THREE.Group>(null);
  const { base, emissive } = useMemo(() => colorFor(body), [body]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 4);
    scaleRef.current += (targetRadius - scaleRef.current) * k;
    xRef.current += (x - xRef.current) * k;
    labelY.current = -targetRadius - 0.6;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scaleRef.current);
      meshRef.current.rotation.y += dt * omega;
    }
    if (groupRef.current) groupRef.current.position.x = xRef.current;
  });

  return (
    <group ref={groupRef} position={[x, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={base}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 1.2 : 0}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      <Html
        position={[0, -targetRadius - 0.55, 0]}
        center
        distanceFactor={10}
        zIndexRange={[10, 0]}
        wrapperClass="pointer-events-none"
      >
        <div className="whitespace-nowrap text-center">
          <div className="text-[0.78rem] font-light tracking-wide text-white">
            {body.name}
          </div>
        </div>
      </Html>
    </group>
  );
}

function FitCamera({ totalWidth, maxRadius, center }: { totalWidth: number; maxRadius: number; center: number }) {
  const { camera, size } = useThree();
  useFrame(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const halfH = Math.tan(fov / 2);
    const halfW = halfH * aspect;
    const distForWidth = (totalWidth / 2 + 1) / halfW;
    const distForHeight = (maxRadius * 1.6 + 1) / halfH;
    const dist = Math.max(distForWidth, distForHeight) * 1.15;
    const targetX = center;
    camera.position.x += (targetX - camera.position.x) * 0.12;
    camera.position.y += (0 - camera.position.y) * 0.12;
    camera.position.z += (dist - camera.position.z) * 0.12;
    camera.lookAt(targetX, 0, 0);
  });
  return null;
}

export function ComparisonScene({ bodies, kind }: SceneProps) {
  const radii = useMemo(() => computeRadii(bodies, kind), [bodies, kind]);
  const { offsets, totalWidth } = useMemo(() => layoutOffsets(radii), [radii]);
  const maxRadius = Math.max(...radii, 0.001);
  const center = offsets.length > 0 ? (offsets[0] - radii[0] + offsets[offsets.length - 1] + radii[radii.length - 1]) / 2 : 0;
  const omega = 0.25; // shared rotation rate.

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 35, near: 0.1, far: 500, position: [center, 0, 30] }}
    >
      <color attach="background" args={["#06080f"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 4, 8]} intensity={1.2} color="#fff8e7" />
      <directionalLight position={[-8, -2, 4]} intensity={0.25} color="#9ec5ff" />
      {bodies.map((b, i) => (
        <SphereBody key={b.id} body={b} targetRadius={radii[i]} x={offsets[i] - totalWidth / 2 + center * 0} omega={omega} />
      ))}
      <FitCamera totalWidth={totalWidth} maxRadius={maxRadius} center={0} />
    </Canvas>
  );
}

useEffect; // tree-shake guard — Html requires React Suspense at parent layer.
