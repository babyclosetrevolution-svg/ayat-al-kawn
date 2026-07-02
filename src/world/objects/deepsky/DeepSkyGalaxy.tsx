import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { hexToRgb, rng, seedFromId, galaxyFormFor, type DeepSkyRendererProps } from "./shared";
import { getSoftGlowTexture } from "./glowTexture";

/**
 * DeepSkyGalaxy — procedural points renderer for catalog galaxies.
 *
 * Three deterministic point layers (bulge, disk, halo) generated once
 * per seed. Distribution depends on the morphological form:
 *   - spiral / barred-spiral: logarithmic arm sweep + dust-lane bias
 *   - lenticular: thin oblate disk + dense bulge, no arms
 *   - elliptical: 3D Gaussian, no arms
 *   - irregular: clumpy random distribution
 *
 * A volumetric core stack (three additive sprites) gives the bulge a
 * bloom-friendly luminous heart. LOD is implemented by attenuating
 * point sizes / sprite opacity with camera distance.
 */
export function DeepSkyGalaxy({ data }: DeepSkyRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const diskMatRef = useRef<THREE.PointsMaterial>(null);
  const haloMatRef = useRef<THREE.PointsMaterial>(null);
  const bulgeMatRef = useRef<THREE.PointsMaterial>(null);
  const coreSpriteRefs = useRef<(THREE.Sprite | null)[]>([]);
  const { camera } = useThree();
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const radius = data.radius;
  const baseColor = data.material?.color ?? "#bcd0ff";
  const form = galaxyFormFor(data.id);

  const { diskGeom, bulgeGeom, haloGeom } = useMemo(() => {
    const seed = seedFromId(data.id);
    const r = rng(seed);
    const [cr, cg, cb] = hexToRgb(baseColor);

    const armCount = form === "barred-spiral" ? 2 : form === "spiral" ? 4 : 0;
    const diskCount = form === "irregular" ? 5500 : form === "elliptical" ? 0 : 8000;
    const bulgeCount = form === "elliptical" ? 9000 : form === "lenticular" ? 5500 : 3500;
    const haloCount = 2500;

    // ── DISK ─────────────────────────────────────────────────────────
    const disk = new THREE.BufferGeometry();
    if (diskCount > 0) {
      const pos = new Float32Array(diskCount * 3);
      const col = new Float32Array(diskCount * 3);
      const flatten = form === "lenticular" ? 0.08 : 0.16;
      for (let i = 0; i < diskCount; i++) {
        let x: number, y: number, z: number;
        if (armCount > 0) {
          // Spiral arm: logarithmic sweep with jitter + dust bias
          const arm = i % armCount;
          const armOffset = (arm / armCount) * Math.PI * 2;
          const t = Math.pow(r(), 0.6);
          const dist = radius * (0.18 + t * 0.95);
          const sweep = 2.5; // total turns
          const theta = armOffset + t * sweep + (r() - 0.5) * 0.5;
          const jitter = (r() - 0.5) * radius * 0.08 * (1 - t * 0.5);
          x = Math.cos(theta) * dist + jitter;
          z = Math.sin(theta) * dist + jitter;
          y = (r() - 0.5) * radius * flatten * (1 - t * 0.6);
        } else {
          // Irregular: clumpy disk-ish
          const t = r();
          const theta = r() * Math.PI * 2;
          const dist = radius * (0.1 + Math.pow(t, 0.7));
          const clump = 0.6 + 0.4 * Math.sin(theta * 3 + seed);
          x = Math.cos(theta) * dist * clump;
          z = Math.sin(theta) * dist * clump;
          y = (r() - 0.5) * radius * 0.35;
        }
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        // Color: warmer toward center, cooler outward, occasional dust
        const radial = Math.min(1, Math.hypot(x, z) / radius);
        const warm = 1 - radial;
        const dust = r() < 0.06;
        const rr = dust ? 0.25 : Math.min(1, cr + warm * 0.35);
        const gg = dust ? 0.18 : Math.min(1, cg + warm * 0.2);
        const bb = dust ? 0.12 : Math.min(1, cb * (0.85 + radial * 0.4));
        col[i * 3] = rr;
        col[i * 3 + 1] = gg;
        col[i * 3 + 2] = bb;
      }
      disk.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      disk.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }

    // ── BULGE / ELLIPTICAL CORE ──────────────────────────────────────
    const bulge = new THREE.BufferGeometry();
    const bp = new Float32Array(bulgeCount * 3);
    const bc = new Float32Array(bulgeCount * 3);
    const ellY = form === "elliptical" ? 0.6 : form === "lenticular" ? 0.18 : 0.35;
    const bulgeR = form === "elliptical" ? radius * 0.85 : radius * 0.28;
    for (let i = 0; i < bulgeCount; i++) {
      // Gaussian-ish 3D distribution.
      const u = r();
      const rad = bulgeR * Math.pow(u, 1.6);
      const phi = r() * Math.PI * 2;
      const cosT = 1 - 2 * r();
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      bp[i * 3] = rad * sinT * Math.cos(phi);
      bp[i * 3 + 1] = rad * cosT * ellY;
      bp[i * 3 + 2] = rad * sinT * Math.sin(phi);
      const warm = 1 - u * 0.4;
      bc[i * 3] = Math.min(1, cr + warm * 0.5);
      bc[i * 3 + 1] = Math.min(1, cg + warm * 0.3);
      bc[i * 3 + 2] = Math.min(1, cb + warm * 0.05);
    }
    bulge.setAttribute("position", new THREE.BufferAttribute(bp, 3));
    bulge.setAttribute("color", new THREE.BufferAttribute(bc, 3));

    // ── HALO ─────────────────────────────────────────────────────────
    const halo = new THREE.BufferGeometry();
    const hp = new Float32Array(haloCount * 3);
    const hc = new Float32Array(haloCount * 3);
    const haloR = radius * 1.15;
    for (let i = 0; i < haloCount; i++) {
      const u = r();
      const rad = haloR * Math.pow(u, 0.35);
      const phi = r() * Math.PI * 2;
      const cosT = 1 - 2 * r();
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      hp[i * 3] = rad * sinT * Math.cos(phi);
      hp[i * 3 + 1] = rad * cosT * (form === "elliptical" ? 0.7 : 0.4);
      hp[i * 3 + 2] = rad * sinT * Math.sin(phi);
      hc[i * 3] = cr * 0.7;
      hc[i * 3 + 1] = cg * 0.7;
      hc[i * 3 + 2] = cb * 0.85;
    }
    halo.setAttribute("position", new THREE.BufferAttribute(hp, 3));
    halo.setAttribute("color", new THREE.BufferAttribute(hc, 3));

    return { diskGeom: disk, bulgeGeom: bulge, haloGeom: halo };
  }, [data.id, radius, baseColor, form]);

  useEffect(() => {
    return () => {
      diskGeom.dispose();
      bulgeGeom.dispose();
      haloGeom.dispose();
    };
  }, [diskGeom, bulgeGeom, haloGeom]);

  // Slow rotation for a sense of cosmic time.
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.0015;

    // LOD: scale point size + sprite opacity by camera distance.
    if (groupRef.current) {
      groupRef.current.getWorldPosition(tmpVec);
      const d = camera.position.distanceTo(tmpVec);
      // Near = full detail; far = compress.
      const near = radius * 4;
      const far = radius * 40;
      const t = THREE.MathUtils.clamp((d - near) / (far - near), 0, 1);
      if (diskMatRef.current) diskMatRef.current.size = THREE.MathUtils.lerp(1.4, 0.6, t);
      if (bulgeMatRef.current) bulgeMatRef.current.size = THREE.MathUtils.lerp(2.6, 1.2, t);
      if (haloMatRef.current) haloMatRef.current.size = THREE.MathUtils.lerp(1.1, 0.6, t);
      // Hide the largest sprite at very-far distance to keep bloom calm.
      const farFade = 1 - t * 0.5;
      coreSpriteRefs.current.forEach((s) => {
        if (s) (s.material as THREE.SpriteMaterial).opacity =
          (s.userData.baseOpacity as number) * farFade;
      });
    }
  });

  const corePalette = useMemo<[number, number, number][]>(() => {
    const [r0, g0, b0] = hexToRgb(baseColor);
    return [
      [Math.min(1, r0 * 1.05), Math.min(1, g0 * 0.85), Math.min(1, b0 * 0.65)],
      [Math.min(1, r0 * 1.1), Math.min(1, g0 * 0.95), Math.min(1, b0 * 0.78)],
      [1.0, Math.min(1, g0 * 1.05 + 0.1), Math.min(1, b0 * 0.95 + 0.1)],
    ];
  }, [baseColor]);

  const haloMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.1,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const diskMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.4,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const bulgeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 2.6,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => {
    haloMaterial.dispose();
    diskMaterial.dispose();
    bulgeMaterial.dispose();
  }, [haloMaterial, diskMaterial, bulgeMaterial]);

  diskMatRef.current = diskMaterial;
  bulgeMatRef.current = bulgeMaterial;
  haloMatRef.current = haloMaterial;

  const bulgeR = radius * (form === "elliptical" ? 0.85 : 0.28);
  const coreLayers: { scale: number; rgb: [number, number, number]; opacity: number }[] = [
    { scale: bulgeR * 8, rgb: corePalette[0], opacity: 0.08 },
    { scale: bulgeR * 3.6, rgb: corePalette[1], opacity: 0.22 },
    { scale: bulgeR * 1.6, rgb: corePalette[2], opacity: 0.55 },
  ];

  return (
    <group ref={groupRef} userData={{ focusKey: data.id }}>
      <points geometry={haloGeom} material={haloMaterial} />
      {diskGeom.attributes.position && (
        <points geometry={diskGeom} material={diskMaterial} />
      )}
      <points geometry={bulgeGeom} material={bulgeMaterial} />

      {coreLayers.map((layer, i) => (
        <sprite
          key={i}
          ref={(el) => {
            coreSpriteRefs.current[i] = el;
            if (el) el.userData.baseOpacity = layer.opacity;
          }}
          scale={[layer.scale, layer.scale, 1]}
        >
          <spriteMaterial
            map={getSoftGlowTexture() ?? undefined}
            color={new THREE.Color(layer.rgb[0], layer.rgb[1], layer.rgb[2])}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
