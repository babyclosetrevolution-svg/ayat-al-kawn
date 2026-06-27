import type { Vector3Tuple } from "three";

/**
 * CelestialBody — canonical data contract for every astronomical object.
 * Rendering components (Star, Planet, Moon) are pure visualizers of this shape;
 * adding a new world should be a data change, not a new component.
 */
export type BodyType = "star" | "planet" | "moon" | "asteroid" | "comet";

export type MaterialKind =
  | "rock"
  | "ice"
  | "desert"
  | "gas"
  | "lava"
  | "earthlike";

export interface TextureDef {
  map?: string;
  normalMap?: string;
  specularMap?: string;
  roughnessMap?: string;
}

export interface MaterialDef {
  kind: MaterialKind;
  color?: string;
  roughness?: number;
  metalness?: number;
  shininess?: number;
  specularColor?: string;
}

export interface AtmosphereDef {
  color: string;
  intensity?: number;
  scale?: number;
}

export interface CloudsDef {
  texture: string;
  opacity?: number;
  speed?: number;
  scale?: number;
}

export interface RingsDef {
  texture?: string;
  innerRadius: number;
  outerRadius: number;
  color?: string;
  opacity?: number;
}

export interface EmissiveHaloDef {
  color: string;
  opacity: number;
  scale: number;
}

export interface EmissiveDef {
  color: string;
  intensity?: number;
  halos?: EmissiveHaloDef[];
  lightColor?: string;
  lightIntensity?: number;
}

export interface OrbitDef {
  parentId: string;
  distance: number;
  /** Seconds per revolution in scene time. */
  period: number;
  /** Degrees. */
  inclination?: number;
  /** Radians. Starting angle. */
  phase?: number;
}

/**
 * Generic celestial body record. Every field besides id / name / type / radius /
 * rotationPeriod is optional so the same shape covers stars, planets, moons,
 * asteroids and comets without subclassing.
 */
export interface CelestialBodyData {
  id: string;
  name: string;
  type: BodyType;
  /** Scene-space radius. */
  radius: number;
  /** Seconds per full axial rotation in scene time. */
  rotationPeriod: number;
  /** Degrees. */
  axialTilt?: number;
  /** World-space position for root bodies. */
  position?: Vector3Tuple;
  /** Orbital definition for satellites and planets around a parent. */
  orbit?: OrbitDef;
  textures?: TextureDef;
  material?: MaterialDef;
  atmosphere?: AtmosphereDef;
  clouds?: CloudsDef;
  rings?: RingsDef;
  emissive?: EmissiveDef;
  /** Default camera distance = radius * focusDistanceFactor. */
  focusDistanceFactor?: number;
  description?: string;
}
