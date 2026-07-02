import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { hexToRgb, rng, seedFromId, type DeepSkyRendererProps } from "./shared";
import { getSoftGlowTexture } from "./glowTexture";

/**
 * DeepSkySupernovaRemnant — expanding shell + radial filaments.
 *
 * Shell: dense points distributed on a slightly thick sphere shell.
 * Filaments: radial line segments stretching outward from the center,
 * shaded blue→pink toward the edge. The whole group slowly expands /
 * pulses to suggest ongoing expansion.
 */
export function DeepSkySupernovaRemnant({ data }: DeepSkyRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsMatRef = useRef<THREE.PointsMaterial>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const { camera } = useThree();
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const radius = data.radius;
  const baseColor = data.material?.color ?? "#ffd28c";

  const { shellGeom, filamentGeom } = useMemo(() => {
    const r = rng(seedFromId(data.id));
    const [cr, cg, cb] = hexToRgb(baseColor);

    // Shell points
    const SHELL_COUNT = 5000;
    const sp = new Float32Array(SHELL_COUNT * 3);
    const sc = new Float32Array(SHELL_COUNT * 3);
    for (let i = 0; i < SHELL_COUNT; i++) {
      const phi = r() * Math.PI * 2;
      const cosT = 1 - 2 * r();
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      const rad = radius * (0.85 + r() * 0.25);
      sp[i * 3] = rad * sinT * Math.cos(phi);
      sp[i * 3 + 1] = rad * cosT;
      sp[i * 3 + 2] = rad * sinT * Math.sin(phi);
      // Hot blue inner edge, warmer outer ejecta
      const edge = (rad - radius * 0.85) / (radius * 0.25);
      const blue = 1 - edge;
      sc[i * 3] = Math.min(1, cr * (0.6 + edge * 0.5) + 0.2);
      sc[i * 3 + 1] = Math.min(1, cg * (0.7 + edge * 0.3) + 0.1);
      sc[i * 3 + 2] = Math.min(1, 0.4 + blue * 0.6);
    }
    const shell = new THREE.BufferGeometry();
    shell.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    shell.setAttribute("color", new THREE.BufferAttribute(sc, 3));

    // Radial filaments: pairs of points => LineSegments
    const FIL_COUNT = 220;
    const fp = new Float32Array(FIL_COUNT * 6);
    const fc = new Float32Array(FIL_COUNT * 6);
    for (let i = 0; i < FIL_COUNT; i++) {
      const phi = r() * Math.PI * 2;
      const cosT = 1 - 2 * r();
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      const dirX = sinT * Math.cos(phi);
      const dirY = cosT;
      const dirZ = sinT * Math.sin(phi);
      const inner = radius * (0.6 + r() * 0.25);
      const outer = radius * (1.0 + r() * 0.25);
      fp[i * 6] = dirX * inner;
      fp[i * 6 + 1] = dirY * inner;
      fp[i * 6 + 2] = dirZ * inner;
      fp[i * 6 + 3] = dirX * outer;
      fp[i * 6 + 4] = dirY * outer;
      fp[i * 6 + 5] = dirZ * outer;
      // Inner end: hot bluish; outer end: warmer
      fc[i * 6] = 0.6;
      fc[i * 6 + 1] = 0.85;
      fc[i * 6 + 2] = 1.0;
      fc[i * 6 + 3] = Math.min(1, cr + 0.2);
      fc[i * 6 + 4] = Math.min(1, cg);
      fc[i * 6 + 5] = Math.min(1, cb * 0.6);
    }
    const fil = new THREE.BufferGeometry();
    fil.setAttribute("position", new THREE.BufferAttribute(fp, 3));
    fil.setAttribute("color", new THREE.BufferAttribute(fc, 3));

    return { shellGeom: shell, filamentGeom: fil };
  }, [data.id, radius, baseColor]);

  useEffect(() => () => {
    shellGeom.dispose();
    filamentGeom.dispose();
  }, [shellGeom, filamentGeom]);

  const shellMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1.3,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => {
    shellMaterial.dispose();
    lineMaterial.dispose();
  }, [shellMaterial, lineMaterial]);
  pointsMatRef.current = shellMaterial;
  lineMatRef.current = lineMaterial;

  // Pulsing expansion (visual approximation of ongoing shell motion).
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.25) * 0.015;
    group.scale.setScalar(pulse);

    group.getWorldPosition(tmpVec);
    const d = camera.position.distanceTo(tmpVec);
    const near = radius * 3;
    const far = radius * 30;
    const t = THREE.MathUtils.clamp((d - near) / (far - near), 0, 1);
    if (pointsMatRef.current) pointsMatRef.current.size = THREE.MathUtils.lerp(1.6, 0.8, t);
    if (lineMatRef.current) lineMatRef.current.opacity = THREE.MathUtils.lerp(0.6, 0.2, t);
  });

  return (
    <group ref={groupRef} userData={{ focusKey: data.id }}>
      <points geometry={shellGeom} material={shellMaterial} />
      <lineSegments geometry={filamentGeom} material={lineMaterial} />
      {/* Central hot core */}
      <sprite scale={[radius * 0.8, radius * 0.8, 1]}>
        <spriteMaterial
          map={getSoftGlowTexture() ?? undefined}
          color={new THREE.Color(0.7, 0.9, 1)}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
