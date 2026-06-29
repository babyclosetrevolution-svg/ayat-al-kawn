import { useState } from "react";
import { Play, Compass } from "lucide-react";
import { JOURNEYS } from "../catalog";
import { JourneyEngine } from "../engine/JourneyEngine";
import { useJourneyState } from "../hooks/useJourneyState";
import { resolveText } from "../../encyclopedia/i18n/locale";
import { useLocale } from "../../encyclopedia/i18n/useLocale";

/**
 * JourneyPicker — launcher with five guided tours. Hidden once a journey
 * starts; the JourneyPlayer takes over the bottom of the screen.
 */
export function JourneyPicker() {
  const [open, setOpen] = useState(false);
  const state = useJourneyState();
  const locale = useLocale();
  if (state.active) return null;

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-40 flex flex-col items-start gap-2">
      {open && (
        <div className="w-[20rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-md text-white shadow-xl">
          <div className="mb-3 text-[0.62rem] uppercase tracking-[0.3em] text-white/55">
            Guided Journeys
          </div>
          <ul className="flex flex-col gap-2">
            {JOURNEYS.map((j) => (
              <li key={j.id}>
                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.07]"
                  onClick={() => {
                    JourneyEngine.start(j);
                    setOpen(false);
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: j.accent ?? "#4f9dff", color: "#000" }}
                  >
                    <Play size={12} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {resolveText(j.title, locale)}
                    </span>
                    <span className="block text-[0.7rem] leading-snug text-white/55">
                      {resolveText(j.summary, locale)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3.5 text-[0.68rem] uppercase tracking-[0.25em] text-white/80 backdrop-blur-md hover:text-white"
      >
        <Compass size={14} /> Journeys
      </button>
    </div>
  );
}
