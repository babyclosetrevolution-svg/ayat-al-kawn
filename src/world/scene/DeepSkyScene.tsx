import type { DeepSkyBodyData } from "../../data/deep-sky";
import { DeepSkyObject } from "../objects/deepsky/DeepSkyObject";

/**
 * DeepSkyScene — fan-out renderer for the deep-sky catalog.
 *
 * Each entry is rendered through its category-specific procedural
 * renderer. The scene has no shared state of its own; mounting is
 * driven entirely by the data layer.
 */
export function DeepSkyScene({ items }: { items: DeepSkyBodyData[] }) {
  return (
    <group>
      {items.map((b) => (
        <DeepSkyObject key={b.id} data={b} />
      ))}
    </group>
  );
}
