import { useEffect, useState } from "react";
import { FocusRegistry, type FocusKey } from "../world/state/focus";

/**
 * ObjectSelector — minimal target picker for Earth / Moon / Sun.
 * Pure UI: writes to FocusRegistry; the CameraSystem reacts and animates.
 */
const ITEMS: { key: Exclude<FocusKey, null>; label: string }[] = [
  { key: "earth", label: "Earth" },
  { key: "moon", label: "Moon" },
  { key: "sun", label: "Sun" },
];

export function ObjectSelector({ visible }: { visible: boolean }) {
  const [active, setActive] = useState<FocusKey>(FocusRegistry.getActive());

  useEffect(() => FocusRegistry.subscribe(setActive), []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-auto flex gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-2 backdrop-blur-md">
        {ITEMS.map((it) => {
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => FocusRegistry.setActive(it.key)}
              className={`rounded-full px-5 py-2 text-[0.65rem] uppercase tracking-[0.35em] transition-colors duration-300 ${
                isActive
                  ? "bg-white/90 text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
