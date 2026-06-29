import { useEffect, useState } from "react";
import { ComparisonState } from "../../scale";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";
import { EmptyState, SectionCard } from "../../knowledge/components/blocks";

/**
 * CompareView — entry point to the Cosmic Scale overlay from inside the
 * Knowledge Panel. Lists a few likely comparison targets so users can
 * launch a side-by-side scale view in one click.
 */
const DEFAULT_TARGETS = [
  "earth",
  "moon",
  "sun",
  "jupiter",
  "milky-way",
];

export function CompareView({ id }: { id: string | null }) {
  const [targets, setTargets] = useState<string[]>([]);

  useEffect(() => {
    if (!id) {
      setTargets([]);
      return;
    }
    setTargets(DEFAULT_TARGETS.filter((t) => t !== id && KnowledgeRegistry.has(t)));
  }, [id]);

  if (!id) return <EmptyState message="Select an object to compare its scale." />;
  const entry = KnowledgeRegistry.resolve(id);

  return (
    <SectionCard title="Cosmic scale">
      <p className="text-[0.9rem] font-light text-white/75">
        Compare <span className="text-white">{entry?.title ?? id}</span> against another body to feel
        the relative scale. The overlay reuses the existing rendering engine and never reloads the scene.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => ComparisonState.openWith([id])}
          className="rounded-full bg-white/10 px-3.5 py-1.5 text-[0.72rem] uppercase tracking-[0.25em] text-white transition-colors hover:bg-white/20"
        >
          Open scale overlay
        </button>
        {targets.map((t) => {
          const other = KnowledgeRegistry.resolve(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => ComparisonState.openWith([id, t])}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.25em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              vs {other?.title ?? t}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default CompareView;
