import { useEffect, useMemo, useRef, useState } from "react";
import { FocusRegistry, type FocusKey } from "../world/state/focus";
import { VisibilityRegistry } from "../world/state/visibility";
import { CatalogManager } from "../sim";
import type { CelestialBodyData } from "../world/types/CelestialBody";
import type { GalaxyData } from "../data/galaxy/milky-way";

/**
 * ExplorerPanel — grouped, collapsible selector with keyboard navigation.
 *
 * Pure UI: reads the loaded catalogs (solar-system, stars, galaxies),
 * writes selections into the FocusRegistry. The camera and knowledge
 * panels react on their own.
 */
type GroupItem = { id: string; name: string };
type Group = { id: string; label: string; items: GroupItem[] };

function groupBodies(
  bodies: CelestialBodyData[],
  stars: CelestialBodyData[],
  galaxies: GalaxyData[],
): Group[] {
  return [
    { id: "galaxy", label: "Galaxy", items: galaxies.map((g) => ({ id: g.id, name: g.name })) },
    { id: "star", label: "Local Star", items: bodies.filter((b) => b.type === "star") },
    { id: "planets", label: "Planets", items: bodies.filter((b) => b.type === "planet") },
    { id: "moons", label: "Moons", items: bodies.filter((b) => b.type === "moon") },
    { id: "stars", label: "Stars", items: stars },
  ].filter((g) => g.items.length > 0);
}

export function ExplorerPanel({ visible }: { visible: boolean }) {
  const [bodies, setBodies] = useState<CelestialBodyData[]>(
    () => CatalogManager.get("solar-system") ?? [],
  );
  const [stars, setStars] = useState<CelestialBodyData[]>(
    () => CatalogManager.get("stars") ?? [],
  );
  const [galaxies, setGalaxies] = useState<GalaxyData[]>(
    () => CatalogManager.get("galaxies") ?? [],
  );
  const [active, setActive] = useState<FocusKey>(FocusRegistry.getActive());
  const [open, setOpen] = useState(true);
  const [orbits, setOrbits] = useState(VisibilityRegistry.get("orbits"));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (bodies.length === 0) {
      CatalogManager.load("solar-system").then(setBodies);
    }
    if (stars.length === 0) {
      CatalogManager.load("stars").then(setStars);
    }
    if (galaxies.length === 0) {
      CatalogManager.load("galaxies").then(setGalaxies);
    }
  }, [bodies.length, stars.length, galaxies.length]);

  useEffect(() => FocusRegistry.subscribe(setActive), []);
  useEffect(
    () => VisibilityRegistry.subscribe((s) => setOrbits(s.orbits)),
    [],
  );

  // Scroll the active item into view smoothly when selection changes.
  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [active]);

  const groups = useMemo(
    () => groupBodies(bodies, stars, galaxies),
    [bodies, stars, galaxies],
  );
  const flat = useMemo(
    () =>
      groups.flatMap((g) =>
        (collapsed[g.id] ? [] : g.items).filter((b) =>
          query ? b.name.toLowerCase().includes(query.toLowerCase()) : true,
        ),
      ),
    [groups, collapsed, query],
  );


  // Keyboard navigation through the visible list.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (flat.length === 0) return;
    const idx = flat.findIndex((b) => b.id === active);
    const next =
      e.key === "ArrowDown"
        ? flat[(idx + 1) % flat.length]
        : flat[(idx - 1 + flat.length) % flat.length];
    if (next) FocusRegistry.setActive(next.id);
  };

  return (
    <div
      className={`pointer-events-none fixed left-6 top-1/2 z-30 -translate-y-1/2 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
      }`}
    >
      <div
        className="pointer-events-auto w-60 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md focus-within:border-white/25 transition-colors"
        onKeyDown={onKey}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.6rem] uppercase tracking-[0.4em] text-white/70">
            Explorer
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded text-[0.6rem] uppercase tracking-[0.3em] text-white/40 outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-1 focus-visible:ring-white/40"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>

        {open && (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to…"
              aria-label="Quick jump"
              className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[0.78rem] text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
            />

            <div
              ref={listRef}
              className="max-h-[55vh] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]"
            >
              {groups.map((g) => {
                const isCollapsed = collapsed[g.id];
                const items = g.items.filter((b) =>
                  query ? b.name.toLowerCase().includes(query.toLowerCase()) : true,
                );
                if (query && items.length === 0) return null;
                return (
                  <div key={g.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsed((c) => ({ ...c, [g.id]: !c[g.id] }))
                      }
                      className="mb-1 flex w-full items-center justify-between rounded text-[0.55rem] uppercase tracking-[0.35em] text-white/45 outline-none transition-colors hover:text-white/80 focus-visible:text-white focus-visible:ring-1 focus-visible:ring-white/30"
                      aria-expanded={!isCollapsed}
                    >
                      <span>{g.label}</span>
                      <span className="text-white/30">
                        {isCollapsed ? "+" : "−"}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <ul className="space-y-0.5 animate-fade-in">
                        {items.map((b) => {
                          const isActive = active === b.id;
                          return (
                            <li key={b.id}>
                              <button
                                type="button"
                                ref={isActive ? activeBtnRef : undefined}
                                onClick={() => FocusRegistry.setActive(b.id)}
                                aria-current={isActive ? "true" : undefined}
                                className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[0.78rem] outline-none transition-all duration-200 focus-visible:ring-1 focus-visible:ring-white/40 ${
                                  isActive
                                    ? "bg-white/12 text-white"
                                    : "text-white/65 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                                    isActive
                                      ? "bg-sky-300 shadow-[0_0_8px_rgba(125,200,255,0.8)]"
                                      : "bg-white/15 group-hover:bg-white/40"
                                  }`}
                                  aria-hidden
                                />
                                <span className="truncate">{b.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <label className="flex cursor-pointer items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white">
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
              <p className="mt-2 text-[0.55rem] tracking-[0.2em] text-white/30">
                ↑ ↓ to navigate · Dbl-click in scene to focus
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
