import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { VisibilityRegistry } from "../state/visibility";

/**
 * OrbitLine — subtle elegant circular orbit indicator.
 *
 * Drawn as a `LineLoop` in the XZ plane (the orbital plane used by
 * `useOrbit`). Color & opacity stay deliberately understated so the line
 * never competes with the bodies themselves. Visibility tracks the
 * VisibilityRegistry "orbits" flag.
 */
interface Props {
  radius: number;
  color?: string;
  opacity?: number;
  segments?: number;
  /** Optional static tilt applied to the line, in degrees. */
  inclination?: number;
}

export function OrbitLine({
  radius,
  color = "#7ea6d6",
  // Kept intentionally faint — orbits are a secondary readout, never a
  // graphic element competing with the bodies themselves.
  opacity = 0.09,
  segments = 256,
  inclination = 0,
}: Props) {
  const [visible, setVisible] = useState(VisibilityRegistry.get("orbits"));

  useEffect(
    () => VisibilityRegistry.subscribe((s) => setVisible(s.orbits)),
    [],
  );

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
        opacity,
        depthWrite: false,
      }),
    [color, opacity],
  );

  if (!visible) return null;
  const tilt = (inclination * Math.PI) / 180;

  return (
    <lineLoop rotation={[tilt, 0, 0]} geometry={geometry} material={material} />
  );
}
