import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GalaxyData } from "../../data/galaxy/milky-way";
import {
  mulberry32,
  generateBulge,
  generateArm,
  generateHalo,
  type GalacticPoint,
} from "../../sim/coords/galactic";
import { FocusRegistry } from "../state/focus";
import { SpatialPartition, StreamingManager } from "../../streaming";
import { getSoftGlowTexture } from "./deepsky/glowTexture";

/**
 * MilkyWayGalaxy — procedural points renderer (Phase 11.5 refinement).
 *
 * Three deterministic point layers plus volumetric core stack:
 *   1. Spherical halo of faint old stars (Pop II background).
 *   2. Spiral disk: dense arms with dust-lane bias, color temperature
 *      gradient (blue outer arms → warm inner stars → brown dust).
 *   3. Tight central bulge.
 *
 * The galactic core is augmented with three stacked additive billboards
 * (tight white-yellow, medium amber, broad warm halo) so it reads as a
 * volumetric luminous heart of the galaxy when bloom is active.
 *
 * A whisper-slow rotation (~one turn per 8 minutes) lends a sense of
 * cosmic time without becoming animated.
 */
export function MilkyWayGalaxy({ data }: { data: GalaxyData }) {
  const groupRef = useRef<THREE.Group>(null);
  const center = useMemo(() => new THREE.Vector3(...data.center), [data.center]);

  // Build geometry once per galaxy data (deterministic via seed).
  const { bulgeGeom, diskGeom, haloGeom } = useMemo(() => {
    const rand = mulberry32(data.seed);
    const bulge = generateBulge(data, Math.round(data.starCount * 0.3), rand);
    const disk = data.arms.flatMap((arm) => generateArm(data, arm, rand));
    const halo = generateHalo(data, Math.round(data.starCount * 0.18), rand);

    const toGeom = (pts: GalacticPoint[]) => {
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

    return {
      bulgeGeom: toGeom(bulge),
      diskGeom: toGeom(disk),
      haloGeom: toGeom(halo),
    };
  }, [data]);

  useEffect(() => {
    return () => {
      bulgeGeom.dispose();
      diskGeom.dispose();
      haloGeom.dispose();
    };
  }, [bulgeGeom, diskGeom, haloGeom]);

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
      parentId: "milky-way",
    });
    StreamingManager.registerRegion(node);
  }, [data, center]);

  // Whisper-slow galactic rotation — visual illusion of cosmic time.
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.0008;
  });

  const diskMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.5,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const bulgeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2.4,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.1,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      diskMaterial.dispose();
      bulgeMaterial.dispose();
      haloMaterial.dispose();
    };
  }, [diskMaterial, bulgeMaterial, haloMaterial]);

  const bulgeR = data.bulgeRadius;

  return (
    <group
      ref={groupRef}
      position={[center.x, center.y, center.z]}
      userData={{ focusKey: data.id }}
    >
      <points geometry={haloGeom} material={haloMaterial} />
      <points geometry={diskGeom} material={diskMaterial} />
      <points geometry={bulgeGeom} material={bulgeMaterial} />

      {/* Layered galactic-core glow — three additive billboards stack
          into a volumetric, bloom-friendly luminous heart. A shared
          soft radial-gradient map keeps each sprite feathered; without
          it, `spriteMaterial` renders as a solid additive quad and
          washes the whole sky warm. */}
      {/* Two-tier core glow. The outermost 8x halo was lifting the sky
          warm across the whole viewport at galactic distances; removed.
          Remaining sprites are tighter and dimmer — a hint of a bright
          nucleus, not a fullscreen wash. */}
      <sprite scale={[bulgeR * 3.0, bulgeR * 3.0, 1]}>
        <spriteMaterial
          map={getSoftGlowTexture() ?? undefined}
          color={new THREE.Color(0.95, 0.82, 0.65)}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[bulgeR * 1.4, bulgeR * 1.4, 1]}>
        <spriteMaterial
          map={getSoftGlowTexture() ?? undefined}
          color={new THREE.Color(1.0, 0.95, 0.85)}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
