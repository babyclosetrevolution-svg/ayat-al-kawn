import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { hexToRgb, rng, seedFromId, type DeepSkyRendererProps } from "./shared";
import { getSoftGlowTexture } from "./glowTexture";

/**
 * DeepSkyNebula — additive instanced billboards.
 *
 * Volumetric look is faked through a layered scatter of soft sprites
 * distributed in a noisy ellipsoid. Several "filaments" follow noise
 * lines for variation. Cheap and bloom-friendly; LOD attenuates count
 * and per-instance opacity with camera distance.
 */
// Puff texture is created on first client render (never during SSR),
// then cached so every nebula instance shares the same GPU resource.
let PUFF_TEXTURE: THREE.CanvasTexture | null = null;
function getPuffTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (PUFF_TEXTURE) return PUFF_TEXTURE;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  PUFF_TEXTURE = t;
  return PUFF_TEXTURE;
}

export function DeepSkyNebula({ data }: DeepSkyRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const baseColor = data.material?.color ?? "#ff9ab1";
  const radius = data.radius;
  // Planetary / supernova-remnant nebulae read better as a thin shell.
  const shellLike = ["ring-nebula", "helix-nebula", "crab-nebula"].includes(data.id);

  const COUNT = shellLike ? 600 : 900;

  const { positions, scales, colors } = useMemo(() => {
    const r = rng(seedFromId(data.id));
    const [cr, cg, cb] = hexToRgb(baseColor);
    const pos = new Array<THREE.Vector3>(COUNT);
    const sc = new Float32Array(COUNT);
    const col = new Array<THREE.Color>(COUNT);
    for (let i = 0; i < COUNT; i++) {
      let x: number, y: number, z: number;
      if (shellLike) {
        // Thin shell with some thickness
        const phi = r() * Math.PI * 2;
        const cosT = 1 - 2 * r();
        const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
        const rad = radius * (0.85 + r() * 0.3);
        x = rad * sinT * Math.cos(phi);
        y = rad * cosT * 0.85;
        z = rad * sinT * Math.sin(phi);
      } else {
        // Filamentary cloud: anisotropic Gaussian + lobe modulation
        const u = Math.pow(r(), 0.7);
        const phi = r() * Math.PI * 2;
        const cosT = 1 - 2 * r();
        const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
        const lobe = 0.7 + 0.5 * Math.sin(phi * 2 + Math.cos(cosT * 3));
        const rad = radius * u * lobe;
        x = rad * sinT * Math.cos(phi);
        y = rad * cosT * 0.7;
        z = rad * sinT * Math.sin(phi);
      }
      pos[i] = new THREE.Vector3(x, y, z);
      // Puff size varies inversely with density toward edge
      sc[i] = radius * (0.18 + r() * 0.35);
      // Color jitter around base
      const warm = r() * 0.4;
      col[i] = new THREE.Color(
        Math.min(1, cr + warm * 0.3),
        Math.min(1, cg + (r() - 0.5) * 0.2),
        Math.min(1, cb + (r() - 0.5) * 0.2),
      );
    }
    return { positions: pos, scales: sc, colors: col };
  }, [data.id, radius, baseColor, shellLike, COUNT]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getPuffTexture(),
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        vertexColors: true,
      }),
    [],
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  useEffect(() => () => {
    material.dispose();
    geometry.dispose();
  }, [material, geometry]);

  // Set up instance transforms + per-instance colors once.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      dummy.position.copy(positions[i]);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions, scales, colors, COUNT]);

  // Per-frame: face camera + LOD opacity falloff.
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    mesh.getWorldPosition(tmpVec);
    const dist = camera.position.distanceTo(tmpVec);
    // LOD opacity: full near, fade with distance.
    const near = radius * 4;
    const far = radius * 30;
    const t = THREE.MathUtils.clamp((dist - near) / (far - near), 0, 1);
    material.opacity = THREE.MathUtils.lerp(0.1, 0.02, t);

    // Always face camera (billboarding for instanced meshes).
    const camPos = camera.position;
    for (let i = 0; i < COUNT; i++) {
      dummy.position.copy(positions[i]);
      dummy.scale.setScalar(scales[i]);
      // Convert camera position to local space
      const worldPos = positions[i].clone();
      groupRef.current?.localToWorld(worldPos);
      dummy.lookAt(camPos.clone().sub(worldPos).add(positions[i]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} userData={{ focusKey: data.id }}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, COUNT]}
        frustumCulled={false}
      />
      {/* Soft core glow — V1 : rendu seulement quand la texture est prête,
          sinon `spriteMaterial` sans map = carré gris opaque. */}
      {(() => {
        const glow = getSoftGlowTexture();
        if (!glow) return null;
        return (
          <sprite scale={[radius * 1.4, radius * 1.4, 1]}>
            <spriteMaterial
              map={glow}
              color={new THREE.Color(baseColor)}
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        );
      })()}
    </group>
  );
}
