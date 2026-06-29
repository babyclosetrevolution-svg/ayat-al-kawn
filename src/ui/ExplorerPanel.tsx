import { useEffect, useMemo, useRef, useState } from "react";
import { FocusRegistry, type FocusKey } from "../world/state/focus";
import { VisibilityRegistry } from "../world/state/visibility";
import { CatalogManager } from "../sim";
import type { CelestialBodyData } from "../world/types/CelestialBody";
import type { GalaxyData } from "../data/galaxy/milky-way";
import type { DeepSkyBodyData, DeepSkyKind } from "../data/deep-sky";
import { useIsMobile } from "../hooks/use-mobile";
import { UIState } from "./state/uiState";
import { useUIState } from "./hooks/useUIState";
import { GLASS_SURFACE, EYEBROW } from "./styles";
import { GlassIconButton } from "./components/GlassIconButton";

/**
 * ExplorerPanel — contextual navigator.
 *
 * Behaviour summary:
 *  - Always collapsed by default — the Universe owns the screen.
 *  - Desktop: opens as a docked drawer from the left edge. Auto-closes a
 *    short delay after the user picks a target (unless pinned).
 *  - Mobile: a floating glass launcher reveals a bottom sheet. Selecting a
 *    body dismisses the sheet immediately and returns to fullscreen.
 *
 * Reads catalogs and writes to FocusRegistry. Panel state lives in
 * UIState so every UI surface stays in lockstep.
 */

type GroupItem = { id: string; name: string };
type Group = { id: string; label: string; items: GroupItem[] };

const DEEP_SKY_GROUPS: { kind: DeepSkyKind; label: string }[] = [
  { kind: "galaxy", label: "Deep Sky · Galaxies" },
  { kind: "nebula", label: "Deep Sky · Nebulae" },
  { kind: "open-cluster", label: "Deep Sky · Open Clusters" },
  { kind: "globular-cluster", label: "Deep Sky · Globular Clusters" },
  { kind: "star-cluster", label: "Deep Sky · Star Clusters" },
  { kind: "supernova-remnant", label: "Deep Sky · Supernova Remnants" },
];

function groupBodies(
  bodies: CelestialBodyData[],
  stars: CelestialBodyData[],
  galaxies: GalaxyData[],
  deepSky: DeepSkyBodyData[],
): Group[] {
  const groups: Group[] = [
    { id: "galaxy", label: "Galaxy", items: galaxies.map((g) => ({ id: g.id, name: g.name })) },
    { id: "star", label: "Local Star", items: bodies.filter((b) => b.type === "star") },
    { id: "planets", label: "Planets", items: bodies.filter((b) => b.type === "planet") },
    { id: "moons", label: "Moons", items: bodies.filter((b) => b.type === "moon") },
    { id: "stars", label: "Stars", items: stars },
  ];
  for (const g of DEEP_SKY_GROUPS) {
    const items = deepSky.filter((b) => b.deepSky.kind === g.kind);
    if (items.length > 0) {
      groups.push({ id: `deep-sky-${g.kind}`, label: g.label, items });
    }
  }
  return groups.filter((g) => g.items.length > 0);
}

export function ExplorerPanel({ visible }: { visible: boolean }) {
  const isMobile = useIsMobile();
  const ui = useUIState();
  const open = ui.panels.explorer === "open";
  const pinned = ui.pinned.explorer;

  const [bodies, setBodies] = useState<CelestialBodyData[]>(
    () => CatalogManager.get("solar-system") ?? [],
  );
  const [stars, setStars] = useState<CelestialBodyData[]>(
    () => CatalogManager.get("stars") ?? [],
  );
  const [galaxies, setGalaxies] = useState<GalaxyData[]>(
    () => CatalogManager.get("galaxies") ?? [],
  );
  const [deepSky, setDeepSky] = useState<DeepSkyBodyData[]>(
    () => CatalogManager.get("deep-sky") ?? [],
  );
  const [active, setActive] = useState<FocusKey>(FocusRegistry.getActive());
  const [orbits, setOrbits] = useState(VisibilityRegistry.get("orbits"));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (bodies.length === 0) CatalogManager.load("solar-system").then(setBodies);
    if (stars.length === 0) CatalogManager.load("stars").then(setStars);
    if (galaxies.length === 0) CatalogManager.load("galaxies").then(setGalaxies);
    if (deepSky.length === 0) CatalogManager.load("deep-sky").then(setDeepSky);
  }, [bodies.length, stars.length, galaxies.length, deepSky.length]);

  useEffect(() => FocusRegistry.subscribe(setActive), []);
  useEffect(
    () => VisibilityRegistry.subscribe((s) => setOrbits(s.orbits)),
    [],
  );

  // Auto-collapse after a selection (unless the user pinned the drawer).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => UIState.close("explorer"), isMobile ? 50 : 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Scroll the active item into view smoothly.
  useEffect(() => {
    if (!open) return;
    activeBtnRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active, open]);

  // ESC dismisses the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") UIState.close("explorer", { force: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  const onSelect = (id: string) => {
    FocusRegistry.setActive(id);
    if (isMobile) UIState.close("explorer", { force: true });
  };

  const launcherOpacity = ui.activity === "cinematic" ? "opacity-0" : "opacity-100";

  // ============================== launcher ==============================
  const launcher = (
    <div
      className={`pointer-events-none fixed z-30 transition-opacity duration-500 ease-out ${
        visible && !open ? launcherOpacity : "opacity-0"
      } ${isMobile ? "left-5" : "left-5 top-1/2 -translate-y-1/2"}`}
      style={
        isMobile
          ? { bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }
          : undefined
      }
      aria-hidden={!visible || open}
    >
      <div className="pointer-events-auto">
        <GlassIconButton
          size={isMobile ? "lg" : "md"}
          onClick={() => UIState.open("explorer")}
          aria-label="Open explorer"
          title="Explorer"
        >
          <ExplorerGlyph />
        </GlassIconButton>
      </div>
    </div>
  );


  // =============================== panel ===============================
  const body = (
    <div
      className="flex h-full flex-col"
      onKeyDown={onKey}
    >
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className={EYEBROW}>Explorer</span>
          {pinned && (
            <span className="text-[0.5rem] uppercase tracking-[0.35em] text-sky-300/80">
              Pinned
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isMobile && (
            <button
              type="button"
              onClick={() => UIState.setPinned("explorer", !pinned)}
              aria-pressed={pinned}
              aria-label={pinned ? "Unpin explorer" : "Pin explorer"}
              className={`rounded-full px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.3em] outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/40 ${
                pinned
                  ? "text-sky-300 hover:text-sky-200"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {pinned ? "Pinned" : "Pin"}
            </button>
          )}
          <button
            type="button"
            onClick={() => UIState.close("explorer", { force: true })}
            aria-label="Close explorer"
            className="rounded-full px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/45 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Close
          </button>
        </div>
      </header>

      <div className="px-5 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the universe…"
          aria-label="Search celestial bodies"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[0.82rem] text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
        />
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]"
      >
        {groups.map((g) => {
          const isCollapsed = collapsed[g.id];
          const items = g.items.filter((b) =>
            query ? b.name.toLowerCase().includes(query.toLowerCase()) : true,
          );
          if (query && items.length === 0) return null;
          return (
            <div key={g.id} className="px-2">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [g.id]: !c[g.id] }))}
                className="mb-1.5 flex w-full items-center justify-between rounded-md px-2 py-1 text-[0.55rem] uppercase tracking-[0.35em] text-white/45 outline-none transition-colors hover:text-white/80 focus-visible:text-white focus-visible:ring-1 focus-visible:ring-white/30"
                aria-expanded={!isCollapsed}
              >
                <span>{g.label}</span>
                <span className="text-white/30">{isCollapsed ? "+" : "−"}</span>
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
                          onClick={() => onSelect(b.id)}
                          aria-current={isActive ? "true" : undefined}
                          className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[0.82rem] outline-none transition-all duration-200 focus-visible:ring-1 focus-visible:ring-white/40 ${
                            isActive
                              ? "bg-white/12 text-white"
                              : "text-white/65 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                              isActive
                                ? "bg-sky-300 shadow-[0_0_10px_rgba(125,200,255,0.85)]"
                                : "bg-white/15 group-hover:bg-white/45"
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

      <div className="border-t border-white/8 px-5 py-3">
        <label className="flex cursor-pointer items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white">
          <span>Orbit lines</span>
          <input
            type="checkbox"
            checked={orbits}
            onChange={(e) => VisibilityRegistry.set("orbits", e.target.checked)}
            className="h-3 w-3 accent-white"
          />
        </label>
        <p className="mt-2 text-[0.5rem] tracking-[0.2em] text-white/30">
          ↑ ↓ navigate · Esc close · double-click in scene to focus
        </p>
      </div>
    </div>
  );

  // ========================== layered rendering ==========================
  if (!visible) return null;
  return (
    <>
      {launcher}



      {/* Backdrop — clicking outside collapses the panel. */}
      <div
        onClick={() => UIState.close("explorer")}
        aria-hidden
        className={`fixed inset-0 z-20 transition-opacity duration-500 ${
          open && (isMobile || !pinned)
            ? "pointer-events-auto bg-black/20 opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {isMobile ? (
        <aside
          role="dialog"
          aria-label="Explorer"
          aria-hidden={!open}
          className={`fixed inset-x-3 z-40 ${GLASS_SURFACE} flex max-h-[70dvh] flex-col overflow-hidden transition-all duration-500 ease-out ${
            open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
          }`}
          style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" aria-hidden />
          {body}
        </aside>

      ) : (
        <aside
          role="dialog"
          aria-label="Explorer"
          aria-hidden={!open}
          className={`fixed left-3 top-1/2 z-40 -translate-y-1/2 ${GLASS_SURFACE} flex h-[min(78dvh,720px)] max-h-[calc(100dvh-1.5rem)] w-[280px] flex-col overflow-hidden transition-all duration-500 ease-out ${
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-6 opacity-0"
          }`}
          style={{ transform: open ? "translate(0, -50%)" : "translate(-1.5rem, -50%)" }}
        >
          {body}
        </aside>
      )}
    </>
  );
}

function ExplorerGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.2" />
      <ellipse cx="12" cy="12" rx="9" ry="3.4" />
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.4"
        transform="rotate(60 12 12)"
      />
    </svg>
  );
}
