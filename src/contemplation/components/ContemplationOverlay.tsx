import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useContemplation } from "../hooks/useContemplation";
import { ContemplationState } from "../state";
import { ContemplationRegistry } from "../registry/entries";
import { resolveText } from "../../encyclopedia/i18n/locale";
import { useLocale } from "../../encyclopedia/i18n/useLocale";
import type { ContemplationCategory } from "../types";

const CATEGORY_STYLES: Record<ContemplationCategory, { label: string; accent: string; font: string }> = {
  verse: { label: "Verse", accent: "#e9c46a", font: "font-serif italic" },
  reflection: { label: "Reflection", accent: "#9fd0ff", font: "font-light" },
  quotation: { label: "Quotation", accent: "#f7a8c4", font: "font-light italic" },
};

/**
 * ContemplationOverlay — full-screen, calm rotation of contemplative
 * content. Scientific data is never mixed in. The renderer behind it
 * stays untouched; we only dim and overlay text.
 */
export function ContemplationOverlay() {
  const s = useContemplation();
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const pool = useMemo(
    () => ContemplationRegistry.all().filter((e) => s.enabled[e.category]),
    [s.enabled],
  );

  useEffect(() => {
    if (!s.active || pool.length === 0) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % pool.length), s.rotationSeconds * 1000);
    return () => window.clearInterval(id);
  }, [s.active, s.rotationSeconds, pool.length]);

  useEffect(() => {
    if (index >= pool.length) setIndex(0);
  }, [index, pool.length]);

  if (!s.active) return null;
  if (pool.length === 0) {
    return (
      <FullScreen>
        <p className="text-center text-white/55">Every category is disabled — enable one to begin.</p>
        <ExitButton />
      </FullScreen>
    );
  }
  const entry = pool[index % pool.length];
  const style = CATEGORY_STYLES[entry.category];
  return (
    <FullScreen>
      <div
        className="px-6 text-center"
        style={{ animation: "contemplate-fade 1.2s ease-out" }}
        key={entry.id}
      >
        <div
          className="mb-6 text-[0.65rem] uppercase tracking-[0.45em]"
          style={{ color: style.accent }}
        >
          {style.label}
        </div>
        <p className={`mx-auto max-w-2xl text-balance text-2xl leading-relaxed text-white/85 sm:text-3xl ${style.font}`}>
          {resolveText(entry.text, locale)}
        </p>
        {entry.source && (
          <div className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">— {entry.source}</div>
        )}
      </div>
      <ExitButton />
      <style>{`@keyframes contemplate-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </FullScreen>
  );
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
      {children}
    </div>
  );
}

function ExitButton() {
  return (
    <button
      onClick={() => ContemplationState.patch({ active: false })}
      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 hover:text-white"
      aria-label="Exit contemplation"
    >
      <X size={14} />
    </button>
  );
}
