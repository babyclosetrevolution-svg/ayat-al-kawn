import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CelestialBodyData } from "../types/CelestialBody";
import { FocusRegistry } from "../state/focus";
import { EmissiveStarMaterial } from "../materials/EmissiveStarMaterial";
import { SolarCorona } from "../../render/SolarCorona";
import { temperatureToColors } from "../../render/StarColor";
import { useRotation } from "../../sim";
import { useScienceParam } from "../../science/hooks/useScienceParam";


/**
 * Star — generic emissive body.
 *
 * Appearance is derived from data: surface color from effective
 * temperature, corona tint follows suit, and luminosity (when available)
 * scales the camera-facing glare so bright giants out-bloom dim dwarfs.
 *
 * Local-star fixtures still work: the Sun supplies its own light source
 * via `emissive.lightColor`; distant catalog stars do not emit lights
 * because they would over-fill the solar system.
 */
export function Star({ data }: { data: CelestialBodyData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => new THREE.Vector3(...(data.position ?? [0, 0, 0])),
    [data],
  );

  useMemo(() => {
    FocusRegistry.register(data.id, {
      position: pos.clone(),
      distance: data.radius * (data.focusDistanceFactor ?? 4),
    });
  }, [data, pos]);

  useRotation(meshRef, { period: data.rotationPeriod });

  const colors = useMemo(
    () => temperatureToColors(data.science?.effectiveTemperatureK),
    [data.science?.effectiveTemperatureK],
  );

  // Luminosity → glare scaling. log-compressed so 10⁵ L☉ stars don't blow up.
  const lum = data.science?.luminositySuns;
  const luminosityScale = useMemo(() => {
    if (!lum) return 1;
    return 0.55 + 0.35 * Math.log10(Math.max(0.001, lum));
  }, [lum]);

  const e = data.emissive;

  return (
    <group position={pos}>
      {e?.lightColor && (
        <pointLight
          color={e.lightColor}
          intensity={e.lightIntensity ?? 4}
          distance={0}
          decay={0}
        />
      )}
      <mesh ref={meshRef} userData={{ focusKey: data.id }}>
        <sphereGeometry args={[data.radius, 96, 96]} />
        <EmissiveStarMaterial
          coldColor={colors.cold}
          hotColor={colors.hot}
          rimColor={colors.rim}
        />
      </mesh>
      <SolarCorona
        radius={data.radius}
        color={e?.color ?? colors.rim}
        intensityScale={Math.max(0.4, luminosityScale)}
      />
      {e?.halos?.map((h, i) => (
        <mesh key={i} scale={h.scale}>
          <sphereGeometry args={[data.radius, 48, 48]} />
          <meshBasicMaterial
            color={new THREE.Color(h.color)}
            transparent
            opacity={h.opacity * 0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
