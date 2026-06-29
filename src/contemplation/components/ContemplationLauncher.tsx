import { useState } from "react";
import { Moon } from "lucide-react";
import { useContemplation } from "../hooks/useContemplation";
import { ContemplationState } from "../state";
import type { ContemplationCategory } from "../types";

/**
 * ContemplationLauncher — discreet toggle + category picker.
 * Only visible in Universe mode; the overlay handles its own UI once active.
 */
export function ContemplationLauncher() {
  const s = useContemplation();
  const [open, setOpen] = useState(false);
  if (s.active) return null;

  return (
    <div className="pointer-events-auto fixed bottom-3 right-36 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-60 rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur-md shadow-xl">
          <div className="mb-3 text-[0.6rem] uppercase tracking-[0.3em] text-white/55">Contemplation</div>
          <p className="mb-3 text-[0.72rem] leading-snug text-white/55">
            Enter a calm, distraction-free space. Pick which content categories you wish to see.
          </p>
          {(["verse", "reflection", "quotation"] as ContemplationCategory[]).map((c) => (
            <label key={c} className="mb-1.5 flex items-center justify-between text-xs text-white/75">
              <span className="capitalize">{c}</span>
              <input
                type="checkbox"
                checked={s.enabled[c]}
                onChange={() => ContemplationState.toggleCategory(c)}
                className="accent-white"
              />
            </label>
          ))}
          <button
            onClick={() => {
              ContemplationState.patch({ active: true });
              setOpen(false);
            }}
            className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
          >
            Begin
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3.5 text-[0.68rem] uppercase tracking-[0.25em] text-white/80 backdrop-blur-md hover:text-white"
      >
        <Moon size={14} /> Contemplate
      </button>
    </div>
  );
}
