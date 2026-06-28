import { useEffect, useState } from "react";
import { FocusRegistry, type FocusKey } from "../world/state/focus";
import { VisibilityRegistry } from "../world/state/visibility";
import { CatalogManager } from "../sim";
import type { CelestialBodyData } from "../world/types/CelestialBody";

/**
 * ExplorerPanel — minimal grouped selector for every catalog body.
 *
 * Pure UI: reads the loaded solar-system catalog, writes selections into
 * the FocusRegistry. The camera system reacts on its own. Stays collapsed
 * by default so the cinematic scene is never crowded.
 */
type Group = { label: string; items: CelestialBodyData[] };

function groupBodies(bodies: CelestialBodyData[]): Group[] {
  const star = bodies.filter((b) => b.type === "star");
  const planets = bodies.filter((b) => b.type === "planet");
  const moons = bodies.filter((b) => b.type === "moon");
  return [
    { label: "Star", items: star },
    { label: "Planets", items: planets },
    { label: "Moons", items: moons },
  ].filter((g) => g.items.length > 0);
}

export function ExplorerPanel({ visible }: { visible: boolean }) {
  const [bodies, setBodies] = useState<CelestialBodyData[]>(
    () => CatalogManager.get("solar-system") ?? [],
  );
  const [active, setActive] = useState<FocusKey>(FocusRegistry.getActive());
  const [open, setOpen] = useState(true);
  const [orbits, setOrbits] = useState(VisibilityRegistry.get("orbits"));

  useEffect(() => {
    if (bodies.length === 0) {
      CatalogManager.load("solar-system").then(setBodies);
    }
  }, [bodies.length]);

  useEffect(() => FocusRegistry.subscribe(setActive), []);
  useEffect(
    () => VisibilityRegistry.subscribe((s) => setOrbits(s.orbits)),
    [],
  );

  const groups = groupBodies(bodies);

  return (
    <div
      className={`pointer-events-none fixed left-6 top-1/2 z-30 -translate-y-1/2 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-auto w-56 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.6rem] uppercase tracking-[0.4em] text-white/70">
            Explorer
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[0.6rem] uppercase tracking-[0.3em] text-white/40 hover:text-white"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>

        {open && (
          <>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {groups.map((g) => (
                <div key={g.label}>
                  <div className="mb-1 text-[0.55rem] uppercase tracking-[0.35em] text-white/40">
                    {g.label}
                  </div>
                  <ul className="space-y-0.5">
                    {g.items.map((b) => {
                      const isActive = active === b.id;
                      return (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => FocusRegistry.setActive(b.id)}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[0.78rem] transition-colors ${
                              isActive
                                ? "bg-white/15 text-white"
                                : "text-white/65 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {b.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <label className="flex cursor-pointer items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-white/55">
                <span>Orbit lines</span>
                <input
                  type="checkbox"
                  checked={orbits}
                  onChange={(e) =>
                    VisibilityRegistry.set("orbits", e.target.checked)
                  }
                  className="h-3 w-3 accent-white"
                />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
