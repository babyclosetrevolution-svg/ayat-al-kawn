import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useObserver } from "../hooks/useObserver";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";

/**
 * ObserverHUD — minimal floating interface.
 *
 * Shows only: current mode, current target, travel speed.
 * Hides automatically after a short period of inactivity so it never
 * competes with the scientific overlays.
 */

const IDLE_HIDE_MS = 4200;

function formatSpeed(s: number): string {
  if (s === 0) return "0";
  if (s < 1) return s.toFixed(2);
  if (s < 100) return s.toFixed(1);
  return Math.round(s).toString();
}

export function ObserverHUD({ visible = true }: { visible?: boolean }) {
  const state = useObserver();
  const [active, setActive] = useState(true);

  useEffect(() => {
    setActive(true);
    const id = setTimeout(() => setActive(false), IDLE_HIDE_MS);
    return () => clearTimeout(id);
  }, [state.mode, state.awareness.focus, Math.round(state.speed * 10)]);

  if (!visible) return null;

  const focusEntry = state.awareness.focus
    ? KnowledgeRegistry.get(state.awareness.focus)
    : undefined;
  const targetLabel = focusEntry?.title ?? state.awareness.focus ?? "—";

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-3 z-30 -translate-x-1/2 transition-opacity duration-700 ${
        active ? "opacity-90" : "opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/45 px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] text-white/75 backdrop-blur-md">
        <span className="flex items-center gap-1.5 text-white/90">
          <Eye size={12} />
          {state.mode}
        </span>
        <span className="h-3 w-px bg-white/15" />
        <span className="normal-case tracking-normal text-white/80">{targetLabel}</span>
        <span className="h-3 w-px bg-white/15" />
        <span className="tabular-nums text-white/70">
          {formatSpeed(state.speed)} <span className="text-white/40">u/s</span>
        </span>
      </div>
    </div>
  );
}
