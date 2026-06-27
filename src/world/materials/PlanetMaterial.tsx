import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { MaterialDef, TextureDef } from "../types/CelestialBody";

/**
 * PlanetMaterial — single component covering every solid-surface preset
 * (rock, ice, desert, gas, lava, earthlike).
 *
 *  - When a specularMap is supplied OR kind is `earthlike`, we use Phong so
 *    oceans glint against star light.
 *  - Otherwise we use Standard with preset roughness keyed to the material kind.
 */
interface Props {
  material?: MaterialDef;
  textures?: TextureDef;
}

function presetRoughness(kind: MaterialDef["kind"]): number {
  switch (kind) {
    case "ice":
      return 0.4;
    case "desert":
      return 0.95;
    case "gas":
      return 0.8;
    case "lava":
      return 0.6;
    case "earthlike":
      return 0.85;
    default:
      return 1;
  }
}

export function PlanetMaterial({ material, textures }: Props) {
  // Stable, ordered URL list so hook count is deterministic per render.
  const urls = useMemo(
    () =>
      [
        textures?.map,
        textures?.normalMap,
        textures?.specularMap,
        textures?.roughnessMap,
      ].filter((u): u is string => Boolean(u)),
    [textures],
  );

  // useLoader requires at least one entry; callers always supply at least `map`.
  // For texture-less bodies, future code can branch before mounting this component.
  const loaded = useLoader(THREE.TextureLoader, urls);

  let i = 0;
  const map = textures?.map ? loaded[i++] : undefined;
  const normalMap = textures?.normalMap ? loaded[i++] : undefined;
  const specularMap = textures?.specularMap ? loaded[i++] : undefined;
  const roughnessMap = textures?.roughnessMap ? loaded[i++] : undefined;

  useMemo(() => {
    [map, normalMap, specularMap, roughnessMap].forEach((t) => {
      if (t) t.anisotropy = 8;
    });
    if (map) map.colorSpace = THREE.SRGBColorSpace;
  }, [map, normalMap, specularMap, roughnessMap]);

  const kind = material?.kind ?? "rock";

  if (kind === "earthlike" || specularMap) {
    return (
      <meshPhongMaterial
        map={map}
        normalMap={normalMap}
        specularMap={specularMap}
        specular={new THREE.Color(material?.specularColor ?? "#333a48")}
        shininess={material?.shininess ?? 18}
        color={material?.color ? new THREE.Color(material.color) : undefined}
      />
    );
  }

  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      roughnessMap={roughnessMap}
      roughness={material?.roughness ?? presetRoughness(kind)}
      metalness={material?.metalness ?? 0}
      color={material?.color ? new THREE.Color(material.color) : undefined}
    />
  );
}
