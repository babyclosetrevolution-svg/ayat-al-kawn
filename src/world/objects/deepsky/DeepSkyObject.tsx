import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { DeepSkyBodyData } from "../../../data/deep-sky";
import { FocusRegistry } from "../../state/focus";
import { DeepSkyGalaxy } from "./DeepSkyGalaxy";
import { DeepSkyNebula } from "./DeepSkyNebula";
import { DeepSkyCluster } from "./DeepSkyCluster";
import { DeepSkySupernovaRemnant } from "./DeepSkySupernovaRemnant";

/**
 * DeepSkyObject — dispatcher that picks the procedural renderer
 * matching the catalog entry's kind, anchors it at the body's
 * world-space position, and republishes the focus target with the
 * actual scene position (overriding the placeholder registration that
 * `Universe` made before any renderer was mounted).
 */
export function DeepSkyObject({ data }: { data: DeepSkyBodyData }) {
  const pos = useMemo(
    () => new THREE.Vector3(...(data.position ?? [0, 0, 0])),
    [data],
  );

  useEffect(() => {
    FocusRegistry.register(data.id, {
      position: pos.clone(),
      distance: data.radius * (data.focusDistanceFactor ?? 4),
    });
  }, [data, pos]);

  const kind = data.deepSky.kind;

  let inner;
  if (kind === "galaxy") inner = <DeepSkyGalaxy data={data} />;
  else if (kind === "nebula") inner = <DeepSkyNebula data={data} />;
  else if (kind === "supernova-remnant") inner = <DeepSkySupernovaRemnant data={data} />;
  else inner = <DeepSkyCluster data={data} />;

  return <group position={pos}>{inner}</group>;
}
