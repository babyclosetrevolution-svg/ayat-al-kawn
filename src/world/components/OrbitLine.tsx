import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VisibilityRegistry } from "../state/visibility";
import { FocusRegistry } from "../state/focus";
import { UniverseScaleEngine } from "../../sim/scale";


/**
 * OrbitLine — subtle circular orbit indicator.
 *
 * Behaviour is deliberately secondary:
 *  - Baseline opacity is very faint (a whisper) so lines never compete
 *    with the bodies or the emptiness of space.
 *  - When the associated body is the active focus, the line brightens
 *    smoothly so the user gets orbital context while exploring.
 *  - When the camera sits far from the orbit's radius (landing view,
 *    galactic scale) the line fades toward zero — the eye should read
 *    depth and darkness, not a diagram.
 */
interface Props {
  radius: number;
  color?: string;
  /** Peak opacity when this orbit's body is actively focused. */
  opacity?: number;
  segments?: number;
  /** Optional static tilt applied to the line, in degrees. */
  inclination?: number;
  /** Body this orbit belongs to (for focus-aware highlighting). */
  bodyId?: string;
}

export function OrbitLine({
  radius,
  color = "#7ea6d6",
  opacity = 0.14,
  segments = 256,
  inclination = 0,
  bodyId,
}: Props) {
  const [visible, setVisible] = useState(VisibilityRegistry.get("orbits"));
  const [activeFocus, setActiveFocus] = useState(FocusRegistry.getActive());
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const currentOpacityRef = useRef(0);

  useEffect(
    () => VisibilityRegistry.subscribe((s) => setVisible(s.orbits)),
    [],
  );
  useEffect(() => FocusRegistry.subscribe(setActiveFocus), []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(a) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [radius, segments]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [color],
  );
  matRef.current = material;

  // Live opacity: focus-aware, distance-aware. Runs even when the line is
  // hidden by the toggle (returns null) — the effect cleanup skips it.
  useFrame((state, dt) => {
    if (!matRef.current) return;
    const isFocused = bodyId != null && activeFocus === bodyId;
    // Distance-aware fade: when the camera is far from this orbit's
    // radius (landing / galactic views), the line dissolves. Near the
    // orbit's own scale it settles at the baseline whisper.
    const camDist = state.camera.position.length();
    const scale = Math.max(radius, 1);
    const ratio = camDist / scale;
    // Comfortable band: ~0.6× to ~3× of the orbit radius. Outside that,
    // fade toward 0. Peak of proximity curve = 1 inside the band.
    let proximity = 1;
    if (ratio < 0.6) proximity = Math.max(0, ratio / 0.6);
    else if (ratio > 3) proximity = Math.max(0, 1 - (ratio - 3) / 6);
    const baseline = opacity * 0.35;
    // Phase 23 : l'opacité finale est multipliée par le facteur publié
    // par l'UniverseScaleEngine pour la couche "orbits". Aucune décision
    // locale — le comportement focus/distance ne fait que moduler *dans*
    // l'enveloppe autorisée par l'engine.
    const scaleOp = UniverseScaleEngine.getLayerOpacity("orbits");
    const target =
      (isFocused ? opacity * proximity : baseline * proximity * 0.9) * scaleOp;
    // Frame-rate independent smoothing.
    const k = 1 - Math.exp(-2.5 * dt);
    currentOpacityRef.current += (target - currentOpacityRef.current) * k;
    matRef.current.opacity = currentOpacityRef.current;
  });

  if (!visible) return null;
  const tilt = (inclination * Math.PI) / 180;

  return (
    <lineLoop rotation={[tilt, 0, 0]} geometry={geometry} material={material} />
  );
}
