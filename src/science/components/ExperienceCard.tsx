import { useState } from "react";
import type { Experience } from "../types";
import { ScienceParams } from "../state/params";
import { ControlRenderer } from "../controls/ControlRenderer";

/**
 * ExperienceCard — a single scientific experience.
 *
 * Renders the description, every bound control, and a small toolbar with
 * play/pause (for playable experiences — toggles between the "real" speed
 * and zero on the first slider) and reset (restores defaults).
 */
export function ExperienceCard({ experience }: { experience: Experience }) {
  const [paused, setPaused] = useState(false);

  const firstSpeed = experience.controls.find(
    (c) => c.kind === "slider" && /speed|rotation|orbit/i.test(c.paramKey),
  );

  const togglePlay = () => {
    if (!firstSpeed || firstSpeed.kind !== "slider") return;
    if (paused) {
      ScienceParams.set(firstSpeed.paramKey, firstSpeed.defaultValue);
      setPaused(false);
    } else {
      ScienceParams.set(firstSpeed.paramKey, 0);
      setPaused(true);
    }
  };

  const resetAll = () => {
    for (const c of experience.controls) ScienceParams.reset(c.paramKey);
    setPaused(false);
  };

  return (
    <article className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[0.95rem] font-light text-white">
            {experience.title}
          </h4>
          <p className="mt-1 text-[0.75rem] font-light leading-snug text-white/55">
            {experience.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {experience.playable && firstSpeed && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={paused ? "Resume" : "Pause"}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/65 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
            >
              {paused ? "Play" : "Pause"}
            </button>
          )}
          <button
            type="button"
            onClick={resetAll}
            aria-label="Reset experience"
            title="Reset to defaults"
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/55 outline-none transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {experience.controls.map((c) => (
          <ControlRenderer key={c.paramKey} spec={c} />
        ))}
      </div>
    </article>
  );
}
