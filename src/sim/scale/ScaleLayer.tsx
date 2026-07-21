import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { UniverseScaleEngine, type ScaleLayer } from "./UniverseScaleEngine";

/**
 * ScaleLayer — le seul mécanisme de visibilité autorisé.
 *
 * Enveloppe un sous-arbre de la scène et applique en continu l'opacité
 * publiée par l'UniverseScaleEngine pour la couche nommée. Ne touche
 * qu'aux matériaux déjà déclarés `transparent` (points, sprites,
 * shaders additifs, lignes) — jamais aux PBR opaques.
 *
 * Lorsque l'opacité tombe sous le seuil d'imperceptibilité, le groupe
 * est masqué (`visible=false`) : zéro coût de rendu et pas de flash
 * puisqu'il n'y a plus rien à voir à ce moment-là.
 *
 * Aucune décision de visibilité n'est prise par les enfants. Cette
 * discipline est la règle absolue de la Phase 23.
 */
export function ScaleLayer({
  layer,
  children,
  minVisible = 0.02,
}: {
  layer: ScaleLayer;
  children: React.ReactNode;
  /** Seuil sous lequel le groupe est masqué. */
  minVisible?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const op = UniverseScaleEngine.getLayerOpacity(layer);
    const visible = op > minVisible;
    if (g.visible !== visible) g.visible = visible;
    if (!visible) return;
    g.traverse((obj) => {
      const asMat = obj as unknown as {
        material?: THREE.Material | THREE.Material[];
      };
      const mat = asMat.material;
      if (!mat) return;
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (!m.transparent) continue;
        const anyM = m as THREE.Material & {
          opacity?: number;
          userData: { __baseOpacity?: number };
        };
        if (anyM.userData.__baseOpacity === undefined) {
          anyM.userData.__baseOpacity = anyM.opacity ?? 1;
        }
        anyM.opacity = (anyM.userData.__baseOpacity ?? 1) * op;
      }
    });
  });

  return <group ref={ref}>{children}</group>;
}
