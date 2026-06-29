import { ExperienceRegistry } from "../registry/experiences";
import { ScienceParams } from "../state/params";
import { ExperienceCard } from "./ExperienceCard";

/**
 * ScienceExploreView — the "Explore" tab. Lists every interactive
 * experience registered for the active body. Empty-state surfaces a clear
 * message rather than a stale tab.
 */
export function ScienceExploreView({ bodyId }: { bodyId: string | null }) {
  const experiences = ExperienceRegistry.forBody(bodyId);
  if (!bodyId || experiences.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[0.78rem] font-light text-white/45">
        No interactive experiences available for this object yet.
      </div>
    );
  }

  const resetBody = () => {
    if (bodyId) ScienceParams.resetNamespace(`${bodyId}.`);
  };

  return (
    <div className="px-5 py-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-[0.7rem] font-light leading-snug text-white/55">
          Adjust the controls below — the scene updates live.
        </p>
        <button
          type="button"
          onClick={resetBody}
          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/55 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
        >
          Reset all
        </button>
      </div>
      <div className="space-y-3">
        {experiences.map((e) => (
          <ExperienceCard key={e.id} experience={e} />
        ))}
      </div>
    </div>
  );
}
