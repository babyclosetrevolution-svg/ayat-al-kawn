import { Pause, Play, SkipForward, SkipBack, X } from "lucide-react";
import { JourneyEngine } from "../engine/JourneyEngine";
import { useJourneyState } from "../hooks/useJourneyState";
import { resolveText } from "../../encyclopedia/i18n/locale";
import { useLocale } from "../../encyclopedia/i18n/useLocale";

/**
 * JourneyPlayer — bottom transport bar shown while a guided tour runs.
 * Provides chapter navigation, pause/resume, skip, and progress.
 */
export function JourneyPlayer() {
  const state = useJourneyState();
  const locale = useLocale();
  if (!state.active) return null;
  const chapter = state.active.chapters[state.chapterIndex];
  const dwell = chapter.dwellSeconds ?? 10;
  const progress = Math.min(1, state.elapsed / dwell);
  const total = state.active.chapters.length;
  return (
    <div className="pointer-events-auto fixed bottom-3 left-1/2 z-40 w-[28rem] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/65 p-4 text-white shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-white/55">
        <span>{resolveText(state.active.title, locale)}</span>
        <span>
          {state.chapterIndex + 1} / {total}
        </span>
      </div>
      <div className="mb-3 text-sm font-medium">{resolveText(chapter.title, locale)}</div>
      {chapter.note && (
        <p className="mb-3 text-[0.78rem] leading-snug text-white/65">
          {resolveText(chapter.note, locale)}
        </p>
      )}
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full transition-[width] duration-200"
          style={{ width: `${progress * 100}%`, background: state.active.accent ?? "#4f9dff" }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Btn onClick={() => JourneyEngine.previous()} aria-label="Previous chapter">
            <SkipBack size={14} />
          </Btn>
          {state.status === "playing" ? (
            <Btn onClick={() => JourneyEngine.pause()} aria-label="Pause">
              <Pause size={14} />
            </Btn>
          ) : (
            <Btn onClick={() => JourneyEngine.resume()} aria-label="Resume">
              <Play size={14} />
            </Btn>
          )}
          <Btn onClick={() => JourneyEngine.next()} aria-label="Next chapter">
            <SkipForward size={14} />
          </Btn>
        </div>
        <Btn onClick={() => JourneyEngine.stop()} aria-label="Exit journey">
          <X size={14} />
        </Btn>
      </div>
    </div>
  );
}

function Btn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
