import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { hexToRgb, rng, seedFromId, type DeepSkyRendererProps } from "./shared";
import { getSoftGlowTexture } from "./glowTexture";

/**
 * DeepSkyCluster — thousands of procedural stars.
 *
 * Open clusters: sparser, irregular, blue-leaning (young hot stars).
 * Globular clusters: dense Gaussian falloff, warm older stars.
 *
 * Single Points draw call, deterministic per id, with per-frame LOD
 * scaling on point size.
 */
export function DeepSkyCluster({ data }: DeepSkyRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const { camera } = useThree();
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const radius = data.radius;
  const baseColor = data.material?.color ?? "#ffefcc";
  const isGlobular = data.deepSky.kind === "globular-cluster";
  const COUNT = isGlobular ? 6000 : 1800;

  const geom = useMemo(() => {
    const r = rng(seedFromId(data.id));
    const [cr, cg, cb] = hexToRgb(baseColor);
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // Density falloff differs between cluster types.
      let rad: number;
      if (isGlobular) {
        // Strong Gaussian → very dense core
        const u = r();
        rad = radius * Math.pow(u, 2.2);
      } else {
        // Open: looser, more uniform
        rad = radius * Math.pow(r(), 1.05);
      }
      const phi = r() * Math.PI * 2;
      const cosT = 1 - 2 * r();
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      pos[i * 3] = rad * sinT * Math.cos(phi);
      pos[i * 3 + 1] = rad * cosT;
      pos[i * 3 + 2] = rad * sinT * Math.sin(phi);

      // Color variation: blue/white for open, yellow/orange for globular,
      // with occasional red giants.
      const u2 = r();
      let rr: number, gg: number, bb: number;
      if (isGlobular) {
        if (u2 < 0.06) {
          // Red giant
          rr = 1.0; gg = 0.55; bb = 0.32;
        } else {
          const warm = 0.7 + r() * 0.3;
          rr = Math.min(1, cr * warm + 0.2);
          gg = Math.min(1, cg * warm + 0.1);
          bb = Math.min(1, cb * warm);
        }
      } else {
        if (u2 < 0.18) {
          // Hot blue-white
          rr = 0.78; gg = 0.86; bb = 1.0;
        } else if (u2 < 0.85) {
          rr = Math.min(1, cr + 0.05);
          gg = Math.min(1, cg + 0.05);
          bb = Math.min(1, cb);
        } else {
          rr = 1.0; gg = 0.78; bb = 0.55;
        }
      }
      col[i * 3] = rr;
      col[i * 3 + 1] = gg;
      col[i * 3 + 2] = bb;

      // Brighter stars sparse; uniform default
      sizes[i] = r() < 0.04 ? 2.4 : 1.0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [data.id, radius, baseColor, isGlobular, COUNT]);

  useEffect(() => () => geom.dispose(), [geom]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.6,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  matRef.current = material;

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !matRef.current) return;
    group.getWorldPosition(tmpVec);
    const d = camera.position.distanceTo(tmpVec);
    const near = radius * 3;
    const far = radius * 25;
    const t = THREE.MathUtils.clamp((d - near) / (far - near), 0, 1);
    matRef.current.size = THREE.MathUtils.lerp(2.0, 0.9, t);
  });

  return (
    <group ref={groupRef} userData={{ focusKey: data.id }}>
      <points geometry={geom} material={material} />
      {/* Faint halo glow for globulars — must use a soft texture, otherwise
          a bare spriteMaterial renders as a solid opaque quad (gray square). */}
      {isGlobular && (() => {
        const glow = getSoftGlowTexture();
        return glow ? (
          <sprite scale={[radius * 2.4, radius * 2.4, 1]}>
            <spriteMaterial
              map={glow}
              color={new THREE.Color(baseColor)}
              transparent
              opacity={0.16}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ) : null;
      })()}
    </group>
  );
}
