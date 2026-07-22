import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { loadHygCatalog, type SkyStar } from "../../data/stars/hyg";
import { SkyIdentityRegistry } from "../state/skyIdentity";

/**
 * RealStarfield — the sky rendered from a real catalog.
 *
 * There are no fake particles. Every point in this buffer is a HYG
 * catalog star (apparent magnitude ≤ 6.5) at its actual RA/Dec and
 * compressed distance. Point size derives from apparent magnitude,
 * color from effective temperature (B-V). The material is a soft
 * radial disc so bright stars glow without pixelation, dim stars
 * remain single-pixel hints.
 *
 * The buffer is drawn with `depthWrite:false` and additive blending so
 * it composes with the rest of the universe without hiding it. The
 * NearStarPromoter mounts real `<Star>` meshes for close entries on
 * top; those meshes and this buffer share coordinates, so promotion
 * is continuous — the light doesn't move.
 */
export function RealStarfield({
  onCatalog,
}: {
  onCatalog?: (stars: SkyStar[]) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const catalog = useMemo(() => loadHygCatalog(), []);

  // Register every star in the identity table exactly once.
  useEffect(() => {
    SkyIdentityRegistry.registerMany(
      catalog.map((s) => ({
        id: s.id,
        type: "star",
        name: s.name || s.bayer || s.id,
        ref: s.constellation,
      })),
    );
    onCatalog?.(catalog);
  }, [catalog, onCatalog]);

  const { positions, colors, sizes } = useMemo(() => {
    const n = catalog.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const s = catalog[i];
      positions[i * 3 + 0] = s.position[0];
      positions[i * 3 + 1] = s.position[1];
      positions[i * 3 + 2] = s.position[2];

      // Temperature → RGB (simple two-stop palette on a Kelvin scale).
      // Cool stars lean red-orange, hot stars lean blue-white.
      const t = THREE.MathUtils.clamp((s.temperatureK - 3000) / 12000, 0, 1);
      // Blend from deep amber (2500 K) to cold blue (~15 000 K).
      const r = THREE.MathUtils.lerp(1.0, 0.72, t);
      const g = THREE.MathUtils.lerp(0.68, 0.86, t);
      const b = THREE.MathUtils.lerp(0.38, 1.0, t);
      c.setRGB(r, g, b);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // Apparent magnitude → point size. mag 6.5 ≈ tiny hint,
      // mag −1 (Sirius) ≈ a small but distinct disc.
      const bright = Math.max(0.0, 6.8 - s.mag); // 0..~7.8
      sizes[i] = 1.1 + Math.pow(bright, 1.35) * 0.55;
    }
    return { positions, colors, sizes };
  }, [catalog]);

  useFrame(({ size, camera }) => {
    if (!materialRef.current) return;
    // V3 — le ciel HYG doit se lire comme une sphère céleste infinie,
    // pas comme un cube de points cartésiens. On publie la position
    // caméra à chaque frame ; le vertex shader projette chaque étoile
    // sur une coquille de rayon fixe autour de la caméra en préservant
    // sa direction réelle. Les positions absolues (donc la promotion
    // par `NearStarPromoter`) restent intactes.
    (materialRef.current.uniforms.uPixelRatio.value as number) =
      Math.min(2, window.devicePixelRatio || 1);
    (materialRef.current.uniforms.uHeight.value as number) = size.height;
    const uCam = materialRef.current.uniforms.uCam.value as THREE.Vector3;
    uCam.copy(camera.position);
  });

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: 1 },
      uHeight: { value: 1080 },
      uCam: { value: new THREE.Vector3() },
      uShellRadius: { value: 60_000 },
    }),
    [],
  );

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        vertexShader={/* glsl */ `
          attribute float aSize;
          varying vec3 vColor;
          uniform float uPixelRatio;
          uniform float uHeight;
          uniform vec3 uCam;
          uniform float uShellRadius;
          void main() {
            vColor = color;
            // V3 — projection sur coquille céleste centrée caméra.
            // Direction réelle préservée (RA/Dec), parallaxe supprimée.
            vec3 dir = position - uCam;
            float len = length(dir);
            vec3 shellPos = uCam + (dir / max(len, 1e-3)) * uShellRadius;
            vec4 mv = modelViewMatrix * vec4(shellPos, 1.0);
            gl_Position = projectionMatrix * mv;
            // Taille angulaire quasi-constante — les étoiles ne
            // rétrécissent pas quand on se déplace.
            gl_PointSize = aSize * uPixelRatio * 1.1;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vColor;
          void main() {
            vec2 d = gl_PointCoord - vec2(0.5);
            float r = length(d);
            if (r > 0.5) discard;
            float core = smoothstep(0.5, 0.06, r);
            float halo = smoothstep(0.5, 0.22, r) * 0.35;
            float a = core + halo;
            gl_FragColor = vec4(vColor * (0.75 + core * 0.55), a);
          }
        `}
      />
    </points>
  );
}
