import { useEffect, useState } from "react";
import { FocusRegistry } from "../../world/state/focus";
import { useActiveKnowledge } from "../hooks/useActiveKnowledge";
import type { KnowledgeEntry } from "../types/KnowledgeEntry";
import {
  BulletList,
  EmptyState,
  FactList,
  HeroHeader,
  ReferenceSection,
  SectionCard,
  StatGrid,
} from "../components/blocks";

/**
 * KnowledgePanel — premium right-side panel surfacing the active body's
 * educational content. Independent from the rendering and simulation
 * engines; reads only from the FocusRegistry via useActiveKnowledge.
 *
 * Auto-opens whenever a body is selected, but the user can close it. The
 * panel re-opens on the next selection change.
 */

type TabId = "overview" | "science" | "exploration" | "gallery" | "references";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "science", label: "Science" },
  { id: "exploration", label: "Exploration" },
  { id: "gallery", label: "Gallery" },
  { id: "references", label: "References" },
];

export function KnowledgePanel({ visible }: { visible: boolean }) {
  const { id, entry } = useActiveKnowledge();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");

  // Auto-open on every selection change, and reset to Overview.
  useEffect(() => {
    if (!id) return;
    setOpen(true);
    setTab("overview");
  }, [id]);

  const shown = visible && open && Boolean(entry);

  return (
    <>
      {/* Reopen affordance when the panel is closed */}
      {visible && entry && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed right-6 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[0.6rem] uppercase tracking-[0.35em] text-white/70 backdrop-blur-md transition-colors hover:text-white"
        >
          {entry.title}
        </button>
      )}

      <aside
        aria-hidden={!shown}
        className={`pointer-events-none fixed right-0 top-0 z-30 flex h-full w-full max-w-[420px] flex-col transition-transform duration-500 ease-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pointer-events-auto flex h-full flex-col border-l border-white/10 bg-black/55 backdrop-blur-xl">
          {entry ? (
            <>
              <div className="flex items-start justify-between">
                <HeroHeader
                  title={entry.title}
                  subtitle={entry.subtitle}
                  eyebrow={entry.category}
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close knowledge panel"
                  className="m-5 rounded-full border border-white/10 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white"
                >
                  Close
                </button>
              </div>

              <TabBar tab={tab} setTab={setTab} />

              <div className="flex-1 overflow-y-auto pb-10">
                {tab === "overview" && <OverviewTab entry={entry} />}
                {tab === "science" && <ScienceTab entry={entry} />}
                {tab === "exploration" && <ExplorationTab entry={entry} />}
                {tab === "gallery" && (
                  <EmptyState message="Gallery coming in a future phase." />
                )}
                {tab === "references" && <ReferencesTab entry={entry} />}
              </div>
            </>
          ) : (
            <EmptyState
              message={
                id
                  ? "No knowledge entry registered for this object yet."
                  : "Select an object to learn more."
              }
            />
          )}
        </div>
      </aside>
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
    <div className="flex gap-1 overflow-x-auto border-b border-white/8 px-5 pb-3">
      {TABS.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.3em] transition-colors ${
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

// Re-export FocusRegistry for ergonomics in tests / future modules.
export { FocusRegistry };
