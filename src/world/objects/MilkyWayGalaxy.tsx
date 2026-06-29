import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { GalaxyData } from "../../data/galaxy/milky-way";
import {
  mulberry32,
  generateBulge,
  generateArm,
} from "../../sim/coords/galactic";
import { FocusRegistry } from "../state/focus";
import { SpatialPartition, StreamingManager } from "../../streaming";

/**
 * MilkyWayGalaxy — procedural points renderer.
 *
 * Two `Points` layers (bulge + spiral disk) generated deterministically
 * from the galaxy data. Additive blending without depth writes keeps the
 * structure readable against the starfield and our local stars without
 * interfering with closer geometry. The renderer is generic: pass any
 * GalaxyData shape and the same code produces a believable spiral.
 */
export function MilkyWayGalaxy({ data }: { data: GalaxyData }) {
  const groupRef = useRef<THREE.Group>(null);
  const center = useMemo(() => new THREE.Vector3(...data.center), [data.center]);

  // Build geometry once per galaxy data (deterministic via seed).
  const { bulgeGeom, diskGeom } = useMemo(() => {
    const rand = mulberry32(data.seed);
    const bulge = generateBulge(data, Math.round(data.starCount * 0.25), rand);
    const disk = data.arms.flatMap((arm) => generateArm(data, arm, rand));

    const toGeom = (pts: ReturnType<typeof generateBulge>) => {
      const g = new THREE.BufferGeometry();
      const positions = new Float32Array(pts.length * 3);
      const colors = new Float32Array(pts.length * 3);
      const sizes = new Float32Array(pts.length);
      for (let i = 0; i < pts.length; i++) {
        positions[i * 3 + 0] = pts[i].x;
        positions[i * 3 + 1] = pts[i].y;
        positions[i * 3 + 2] = pts[i].z;
        colors[i * 3 + 0] = pts[i].r;
        colors[i * 3 + 1] = pts[i].g;
        colors[i * 3 + 2] = pts[i].b;
        sizes[i] = pts[i].size;
      }
      g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      return g;
    };

    return { bulgeGeom: toGeom(bulge), diskGeom: toGeom(disk) };
  }, [data]);

  useEffect(() => {
    return () => {
      bulgeGeom.dispose();
      diskGeom.dispose();
    };
  }, [bulgeGeom, diskGeom]);

  // Publish focus target + spatial partition / streaming registration.
  useEffect(() => {
    FocusRegistry.register(data.id, {
      position: center.clone(),
      distance: data.diskRadius * 1.6,
    });
    const node = SpatialPartition.insert({
      id: `galaxy:${data.id}`,
      level: "sector",
      center: center.clone(),
      radius: data.diskRadius,
      parentId: "milky-way", // logical galactic sector
    });
    StreamingManager.registerRegion(node);
  }, [data, center]);

  // Slow galactic rotation (visual hint only — does not affect anything else).
  // Rotation rate kept extremely low so it never feels animated.
  // (3.6e-5 rad/s ≈ one full turn every ~48 hours of real time.)
  // useFrame would do it but a CSS-like subtle drift is enough here.

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.4,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const bulgeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2.2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      material.dispose();
      bulgeMaterial.dispose();
    };
  }, [material, bulgeMaterial]);

  return (
    <group
      ref={groupRef}
      position={[center.x, center.y, center.z]}
      userData={{ focusKey: data.id }}
    >
      <points geometry={diskGeom} material={material} />
      <points geometry={bulgeGeom} material={bulgeMaterial} />
      {/* Soft warm core glow — billboard centered on the bulge. */}
      <sprite scale={[data.bulgeRadius * 4, data.bulgeRadius * 4, 1]}>
        <spriteMaterial
          color={new THREE.Color(1.0, 0.78, 0.55)}
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}
