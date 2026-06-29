import { useEffect, useMemo, useState } from "react";
import { ComparisonState } from "../engine/state";
import { useComparisonState } from "../hooks/useComparisonState";
import { ComparisonScene } from "./ComparisonScene";
import { getBody, allBodies, isComparable } from "../registry/bodyIndex";
import { metricFor, COMPARISON_LABELS } from "../engine/metrics";
import { buildContextCard } from "../engine/context";
import { SCALE_JOURNEYS, journeyById } from "../registry/journeys";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";
import { FocusRegistry } from "../../world/state/focus";
import type { ComparisonKind } from "../types";

/**
 * ComparisonOverlay — full-screen modal that hosts the scale engine.
 *
 * Mounts the comparison Canvas only while open so the main Universe scene
 * keeps running with no extra cost. Closing the overlay returns control
 * to the regular UI without any scene reload.
 */
const KINDS: ComparisonKind[] = [
  "diameter",
  "mass",
  "gravity",
  "temperature",
  "distance",
  "rotation",
  "orbit",
];

const JOURNEY_AUTOPLAY_MS = 4500;

export function ComparisonOverlay() {
  const snap = useComparisonState();
  const bodies = useMemo(
    () => snap.ids.map(getBody).filter(Boolean) as NonNullable<ReturnType<typeof getBody>>[],
    [snap.ids],
  );
  const card = useMemo(() => buildContextCard(snap.ids, snap.kind), [snap.ids, snap.kind]);
  const journey = journeyById(snap.journeyId);

  // Auto-advance the journey at a steady cadence; the user can also pause
  // by toggling the play button.
  const [autoplay, setAutoplay] = useState(true);
  useEffect(() => {
    if (!snap.open || !journey || !autoplay) return;
    const stepCount = journey.steps.length;
    if (snap.journeyStep >= stepCount - 1) return;
    const t = window.setTimeout(() => {
      ComparisonState.advanceJourney(journey.steps.map((s) => s.id));
    }, JOURNEY_AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [snap.open, snap.journeyStep, snap.journeyId, autoplay, journey]);

  // Esc closes — global shortcut while open.
  useEffect(() => {
    if (!snap.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ComparisonState.close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [snap.open]);

  if (!snap.open) return null;

  const handleFocus = (id: string) => {
    ComparisonState.close();
    FocusRegistry.setActive(id);
  };

  return (
    <div
      role="dialog"
      aria-label="Cosmic Scale comparison"
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-black/85 backdrop-blur-md"
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-3">
        <div className="min-w-0">
          <div className="text-[0.55rem] uppercase tracking-[0.4em] text-white/45">
            Cosmic Scale
          </div>
          <h2 className="text-[1.05rem] font-light text-white">
            {journey ? journey.title : "Compare worlds"}
          </h2>
          {journey && (
            <p className="mt-0.5 text-[0.7rem] font-light text-white/55">
              {journey.summary}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => ComparisonState.close()}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/65 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
        >
          Close
        </button>
      </header>

      {/* Kind selector */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/6 px-5 py-2">
        {KINDS.map((k) => {
          const active = k === snap.kind;
          return (
            <button
              key={k}
              type="button"
              onClick={() => ComparisonState.setKind(k)}
              className={`rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.28em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                active
                  ? "bg-white/12 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {COMPARISON_LABELS[k]}
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div className="relative min-h-0 flex-1">
        {bodies.length >= 1 ? (
          <ComparisonScene bodies={bodies} kind={snap.kind} />
        ) : (
          <div className="flex h-full items-center justify-center text-[0.85rem] font-light text-white/45">
            Add at least one object to compare.
          </div>
        )}

        {/* Context card */}
        {card && bodies.length >= 2 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="pointer-events-auto max-w-xl animate-fade-in rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-center backdrop-blur-md">
              <div className="text-[0.95rem] font-light text-white">
                {card.headline}
              </div>
              <p className="mt-1 text-[0.78rem] font-light text-white/65">
                {card.body}
              </p>
            </div>
          </div>
        )}

        {/* Journey caption */}
        {journey && (
          <div className="pointer-events-none absolute left-4 top-4 max-w-sm">
            <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-[0.72rem] font-light text-white/80 backdrop-blur-md">
              <span className="mr-2 text-[0.55rem] uppercase tracking-[0.3em] text-sky-300/80">
                Step {snap.journeyStep + 1} / {journey.steps.length}
              </span>
              {journey.steps[snap.journeyStep]?.caption ??
                bodies[bodies.length - 1]?.name}
            </div>
          </div>
        )}
      </div>

      {/* Side strip — selected objects + actions */}
      <footer className="border-t border-white/8 px-5 py-3">
        <SelectionStrip
          ids={snap.ids}
          kind={snap.kind}
          onRemove={(id) => ComparisonState.remove(id)}
          onFocus={handleFocus}
        />
        <Toolbar
          kind={snap.kind}
          inJourney={Boolean(journey)}
          autoplay={autoplay}
          setAutoplay={setAutoplay}
        />
      </footer>
    </div>
  );
}

function SelectionStrip({
  ids,
  kind,
  onRemove,
  onFocus,
}: {
  ids: string[];
  kind: ComparisonKind;
  onRemove: (id: string) => void;
  onFocus: (id: string) => void;
}) {
  if (ids.length === 0) {
    return (
      <p className="text-[0.7rem] font-light text-white/45">
        Pick objects below to add them to the comparison.
      </p>
    );
  }
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {ids.map((id) => {
        const body = getBody(id);
        if (!body) return null;
        const metric = metricFor(body, kind);
        return (
          <li
            key={id}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1"
          >
            <button
              type="button"
              onClick={() => onFocus(id)}
              title="Focus this object in the Universe"
              className="text-[0.72rem] font-light text-white outline-none transition-colors hover:text-sky-200 focus-visible:text-sky-200"
            >
              {body.name}
            </button>
            <span className="tabular-nums text-[0.65rem] font-light text-white/55">
              {metric.display}
            </span>
            <button
              type="button"
              onClick={() => onRemove(id)}
              aria-label={`Remove ${body.name}`}
              className="ml-1 grid h-5 w-5 place-items-center rounded-full text-white/55 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Toolbar({
  kind,
  inJourney,
  autoplay,
  setAutoplay,
}: {
  kind: ComparisonKind;
  inJourney: boolean;
  autoplay: boolean;
  setAutoplay: (b: boolean) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showJourneys, setShowJourneys] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setShowPicker((v) => !v);
          setShowJourneys(false);
        }}
        aria-expanded={showPicker}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/70 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
      >
        {showPicker ? "Hide picker" : "Add object"}
      </button>
      <button
        type="button"
        onClick={() => {
          setShowJourneys((v) => !v);
          setShowPicker(false);
        }}
        aria-expanded={showJourneys}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/70 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
      >
        {showJourneys ? "Hide journeys" : "Scale Journey"}
      </button>
      {inJourney && (
        <>
          <button
            type="button"
            onClick={() => setAutoplay(!autoplay)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/70 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
          >
            {autoplay ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => ComparisonState.exitJourney()}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/55 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Exit journey
          </button>
        </>
      )}
      {showPicker && <Picker kind={kind} />}
      {showJourneys && <JourneyList />}
    </div>
  );
}

function Picker({ kind }: { kind: ComparisonKind }) {
  const choices = useMemo(
    () => allBodies().filter((b) => isComparable(b.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  return (
    <div className="basis-full">
      <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-white/8 bg-white/[0.02] p-2 [scrollbar-width:thin]">
        {choices.map((b) => {
          const m = metricFor(b, kind);
          const has = KnowledgeRegistry.has(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => ComparisonState.add(b.id)}
              className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[0.7rem] font-light text-white/85 outline-none transition-colors hover:border-white/25 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
              title={has ? `Open knowledge entry for ${b.name}` : b.name}
            >
              <span>{b.name}</span>
              <span className="tabular-nums text-[0.6rem] text-white/45">
                {m.display}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function JourneyList() {
  return (
    <div className="basis-full">
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {SCALE_JOURNEYS.map((j) => (
          <li key={j.id}>
            <button
              type="button"
              onClick={() =>
                ComparisonState.startJourney(j.id, j.steps.map((s) => s.id), j.kind)
              }
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left outline-none transition-colors hover:border-white/25 focus-visible:ring-1 focus-visible:ring-white/40"
            >
              <div className="text-[0.8rem] font-light text-white">{j.title}</div>
              <p className="mt-0.5 text-[0.68rem] font-light text-white/55">
                {j.summary}
              </p>
              <div className="mt-2 text-[0.55rem] uppercase tracking-[0.3em] text-sky-300/70">
                {COMPARISON_LABELS[j.kind]} · {j.steps.length} steps
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
