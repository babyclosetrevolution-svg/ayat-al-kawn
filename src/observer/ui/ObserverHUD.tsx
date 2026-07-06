import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { useObserver } from "../hooks/useObserver";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";

/**
 * ObserverHUD — minimal floating chip.
 *
 * Displays only: mode, current target, travel speed.
 * Auto-hides after a short inactivity window (no pointer, no key press,
 * no meaningful speed change). Returns instantly on any interaction.
 */

const IDLE_HIDE_MS = 3200;

function formatSpeed(s: number): string {
  if (s === 0) return "0";
  if (s < 1) return s.toFixed(2);
  if (s < 100) return s.toFixed(1);
  return Math.round(s).toString();
}

export function ObserverHUD({ visible = true }: { visible?: boolean }) {
  const state = useObserver();
  const [active, setActive] = useState(true);
  const timerRef = useRef<number | null>(null);
  const lastSpeedBucketRef = useRef(-1);

  // Wake helper — reused for user input and for meaningful state changes.
  useEffect(() => {
    if (!visible) return;
    const wake = () => {
      setActive(true);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setActive(false), IDLE_HIDE_MS);
    };
    wake();
    const wakeEv = () => wake();
    window.addEventListener("pointermove", wakeEv, { passive: true });
    window.addEventListener("pointerdown", wakeEv, { passive: true });
    window.addEventListener("keydown", wakeEv);
    window.addEventListener("wheel", wakeEv, { passive: true });
    return () => {
      window.removeEventListener("pointermove", wakeEv);
      window.removeEventListener("pointerdown", wakeEv);
      window.removeEventListener("keydown", wakeEv);
      window.removeEventListener("wheel", wakeEv);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [visible]);

  // Also wake briefly when mode / focus / large speed change occurs.
  useEffect(() => {
    const bucket = Math.round(Math.log10(1 + state.speed) * 4);
    if (bucket !== lastSpeedBucketRef.current) {
      lastSpeedBucketRef.current = bucket;
      setActive(true);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setActive(false), IDLE_HIDE_MS);
    }
  }, [state.mode, state.awareness.focus, state.speed]);

  if (!visible) return null;

  const focusEntry = KnowledgeRegistry.resolve(state.awareness.focus);
  const targetLabel = focusEntry?.title ?? state.awareness.focus ?? "—";

  return (
    <div
      className={`pointer-events-none fixed left-3 top-14 z-30 transition-opacity duration-[900ms] ${
        active ? "opacity-80" : "opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
        <span className="flex items-center gap-1.5 text-white/85">
          <Eye size={11} />
          {state.mode}
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="normal-case tracking-normal text-white/75">{targetLabel}</span>
        <span className="h-3 w-px bg-white/10" />
        <span className="tabular-nums text-white/65">
          {formatSpeed(state.speed)} <span className="text-white/35">u/s</span>
        </span>
      </div>
    </div>
  );
}
