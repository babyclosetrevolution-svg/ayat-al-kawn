import { useEffect, useRef, useState } from "react";
import { FocusRegistry } from "../../world/state/focus";
import { useActiveKnowledge } from "../hooks/useActiveKnowledge";
import type { KnowledgeEntry } from "../types/KnowledgeEntry";
import { useIsMobile } from "../../hooks/use-mobile";
import { UIState } from "../../ui/state/uiState";
import { useUIState } from "../../ui/hooks/useUIState";
import { GLASS_SURFACE, EYEBROW } from "../../ui/styles";
import { GlassIconButton } from "../../ui/components/GlassIconButton";
import {
  BulletList,
  EmptyState,
  FactList,
  HeroHeader,
  ReferenceSection,
  SectionCard,
  StatGrid,
} from "../components/blocks";
import { DiscoveryView, HistoryStore } from "../../discovery";
import { ScienceExploreView, ExperienceRegistry } from "../../science";

/**
 * KnowledgePanel — scientific journal for the active body.
 *
 * Behaviour:
 *  - Desktop: docked right drawer, opens on selection (unless dismissed),
 *    persists when pinned. Closes when the user clicks outside or hits Esc.
 *  - Mobile: floating info button bottom-right launches a bottom sheet that
 *    returns the user to fullscreen exploration on close.
 */

type TabId = "overview" | "discover" | "explore" | "science" | "exploration" | "references";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "discover", label: "Discover" },
  { id: "explore", label: "Explore" },
  { id: "science", label: "Science" },
  { id: "exploration", label: "Missions" },
  { id: "references", label: "References" },
];


export function KnowledgePanel({ visible }: { visible: boolean }) {
  const { id, entry } = useActiveKnowledge();
  const isMobile = useIsMobile();
  const ui = useUIState();
  const open = ui.panels.knowledge === "open";
  const pinned = ui.pinned.knowledge;
  const [tab, setTab] = useState<TabId>("overview");
  // Hide the Explore tab for bodies that have no registered experiences.
  const hasExperiences = ExperienceRegistry.hasAny(id);
  const availableTabs = TABS.filter((t) => t.id !== "explore" || hasExperiences);
  // If the user is on a now-unavailable tab, fall back to Overview.
  useEffect(() => {
    if (!availableTabs.some((t) => t.id === tab)) setTab("overview");
  }, [tab, availableTabs]);

  const firstRender = useRef(true);

  // New selection — surface the panel automatically on desktop (unless the
  // user explicitly dismissed knowledge for this session via close). On
  // mobile the user must tap the info button to avoid surprise overlays.
  // Skip the very first render so the panel stays collapsed at boot.
  useEffect(() => {
    if (!entry) return;
    setTab("overview");
    // Record the visit in discovery history — every new selection counts.
    if (id) HistoryStore.visit({ id, title: entry.title });
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!isMobile) UIState.open("knowledge");
  }, [id, entry, isMobile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") UIState.close("knowledge", { force: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const launcherOpacity = ui.activity === "cinematic" ? "opacity-0" : "opacity-100";

  // Phase-13 entry point — comparison view is not implemented yet, so we
  // simply surface the intent. The handler stays here so future wiring is
  // a single-file change.
  const notifyCompare = (otherId: string) => {
    import("sonner").then(({ toast }) =>
      toast("Comparison view ships in Phase 13", {
        description: `Selected: ${entry?.title} ↔ ${otherId}`,
      }),
    );
  };

  // ============================== launcher ==============================
  const launcher = (
    <div
      className={`pointer-events-none fixed z-30 transition-opacity duration-500 ease-out ${
        visible && entry && !open ? launcherOpacity : "opacity-0"
      } ${isMobile ? "right-5" : "right-5 top-1/2 -translate-y-1/2"}`}
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
          onClick={() => UIState.open("knowledge")}
          aria-label={entry ? `Open knowledge: ${entry.title}` : "Open knowledge"}
          title={entry?.title}
        >
          <InfoGlyph />
        </GlassIconButton>
      </div>
    </div>
  );


  // =============================== body ================================
  const journal = entry ? (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 pr-5 pt-2">
        <HeroHeader
          title={entry.title}
          subtitle={entry.subtitle}
          eyebrow={entry.category}
        />
        <div className="flex shrink-0 items-center gap-1.5 pt-7">
          {!isMobile && (
            <button
              type="button"
              onClick={() => UIState.setPinned("knowledge", !pinned)}
              aria-pressed={pinned}
              aria-label={pinned ? "Unpin knowledge" : "Pin knowledge"}
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
            onClick={() => UIState.close("knowledge", { force: true })}
            aria-label="Close knowledge panel"
            className="rounded-full px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/45 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Close
          </button>
        </div>
      </div>

      <TabBar tab={tab} setTab={setTab} tabs={availableTabs} />

      <article className="min-h-0 flex-1 overflow-y-auto px-1 pb-10 [scrollbar-width:thin]">
        {tab === "overview" && <OverviewTab entry={entry} />}
        {tab === "discover" && <DiscoveryView onCompareRequest={notifyCompare} />}
        {tab === "explore" && <ScienceExploreView bodyId={id} />}
        {tab === "science" && <ScienceTab entry={entry} />}
        {tab === "exploration" && <ExplorationTab entry={entry} />}
        {tab === "references" && <ReferencesTab entry={entry} />}
      </article>

    </div>
  ) : (
    <EmptyState
      message={
        id
          ? "No knowledge entry registered for this object yet."
          : "Select an object to learn more."
      }
    />
  );

  if (!visible) return null;
  return (
    <>
      {launcher}


      {/* Click-outside backdrop — only catches when not pinned. */}
      <div
        onClick={() => UIState.close("knowledge")}
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
          aria-label="Knowledge"
          aria-hidden={!open}
          className={`fixed inset-x-3 z-40 ${GLASS_SURFACE} flex max-h-[78dvh] flex-col overflow-hidden transition-all duration-500 ease-out ${
            open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
          }`}
          style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" aria-hidden />
          <div className="mt-1 flex items-center justify-between px-5">
            <span className={EYEBROW}>Knowledge</span>
          </div>
          {journal}
        </aside>

      ) : (
        <aside
          role="dialog"
          aria-label="Knowledge"
          aria-hidden={!open}
          className={`fixed right-3 top-1/2 z-40 -translate-y-1/2 ${GLASS_SURFACE} flex h-[min(84dvh,780px)] max-h-[calc(100dvh-1.5rem)] w-[420px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden transition-all duration-500 ease-out`}
          style={{
            transform: open
              ? "translate(0, -50%)"
              : "translate(1.5rem, -50%)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {journal}
        </aside>
      )}
    </>
  );
}

function TabBar({
  tab,
  setTab,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto border-b border-white/8 px-5 pb-3"
    >
      {TABS.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.3em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
              active
                ? "bg-white/12 text-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function OverviewTab({ entry }: { entry: KnowledgeEntry }) {
  return (
    <>
      {entry.quickFacts && <StatGrid items={entry.quickFacts} />}
      {entry.overview && (
        <SectionCard title="Overview">{entry.overview}</SectionCard>
      )}
      {entry.interestingFacts && entry.interestingFacts.length > 0 && (
        <SectionCard title="Did you know?">
          <BulletList items={entry.interestingFacts} />
        </SectionCard>
      )}
      {entry.satellites && entry.satellites.length > 0 && (
        <SectionCard title="Satellites">
          <ul className="space-y-2">
            {entry.satellites.map((s) => (
              <li key={s.name} className="text-[0.9rem] font-light text-white/80">
                <span className="text-white">{s.name}</span>
                {s.note && <span className="text-white/55"> — {s.note}</span>}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}

function ScienceTab({ entry }: { entry: KnowledgeEntry }) {
  const has =
    entry.scientificDescription ||
    entry.physicalProperties ||
    entry.atmosphere ||
    entry.internalStructure ||
    entry.surface;
  if (!has)
    return (
      <EmptyState message="Scientific details will be added in future phases." />
    );
  return (
    <>
      {entry.scientificDescription && (
        <SectionCard title="Scientific description">
          {entry.scientificDescription}
        </SectionCard>
      )}
      {entry.physicalProperties && (
        <SectionCard title="Physical properties">
          <FactList items={entry.physicalProperties} />
        </SectionCard>
      )}
      {entry.atmosphere && (
        <SectionCard title="Atmosphere">
          {entry.atmosphere.summary && (
            <p className="mb-3">{entry.atmosphere.summary}</p>
          )}
          {entry.atmosphere.composition && (
            <FactList items={entry.atmosphere.composition} />
          )}
        </SectionCard>
      )}
      {entry.internalStructure && (
        <SectionCard title="Internal structure">
          {entry.internalStructure.summary && (
            <p className="mb-3">{entry.internalStructure.summary}</p>
          )}
          {entry.internalStructure.layers && (
            <FactList items={entry.internalStructure.layers} />
          )}
        </SectionCard>
      )}
      {entry.surface && (
        <SectionCard title="Surface">
          {entry.surface.summary && <p className="mb-3">{entry.surface.summary}</p>}
          {entry.surface.features && <FactList items={entry.surface.features} />}
        </SectionCard>
      )}
    </>
  );
}

function ExplorationTab({ entry }: { entry: KnowledgeEntry }) {
  if (!entry.exploration)
    return <EmptyState message="Exploration history will be added soon." />;
  return (
    <SectionCard title="Exploration">
      {entry.exploration.summary && (
        <p className="mb-4">{entry.exploration.summary}</p>
      )}
      {entry.exploration.timeline && (
        <ol className="relative space-y-3 border-l border-white/10 pl-5">
          {entry.exploration.timeline.map((e, i) => (
            <li key={i} className="text-[0.88rem] font-light text-white/80">
              <span className="mr-2 text-white/45">{e.year}</span>
              <span className="text-white">{e.mission}</span>
              {e.agency && (
                <span className="ml-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/40">
                  {e.agency}
                </span>
              )}
              {e.note && <div className="mt-0.5 text-white/55">{e.note}</div>}
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

function ReferencesTab({ entry }: { entry: KnowledgeEntry }) {
  if (!entry.references || entry.references.length === 0)
    return <EmptyState message="No references registered for this entry." />;
  return (
    <SectionCard title="References">
      <ReferenceSection items={entry.references} />
    </SectionCard>
  );
}

function InfoGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="10.5" x2="12" y2="16.5" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

// Re-export for ergonomics.
export { FocusRegistry };
