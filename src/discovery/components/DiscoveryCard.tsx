import type { Suggestion } from "../types";
import { activate } from "../hooks/useDiscovery";

/**
 * DiscoveryCard — compact, animated card surface.
 * Quiet by default, lifts on hover. Used by every discovery list.
 */
export function DiscoveryCard({
  suggestion,
  onCompare,
}: {
  suggestion: Suggestion;
  onCompare?: (id: string) => void;
}) {
  const { id, title, category, description, navigable } = suggestion;
  return (
    <article
      className={`group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-3 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] ${
        navigable ? "" : "opacity-90"
      }`}
    >
      <div className="flex items-start gap-3">
        <Thumbnail seed={id} />
        <div className="min-w-0 flex-1">
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-white/40">
            {category}
          </div>
          <h4 className="mt-0.5 truncate text-[0.92rem] font-light text-white">
            {title}
          </h4>
          {description && (
            <p className="mt-1 line-clamp-2 text-[0.72rem] font-light text-white/55">
              {description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            {navigable ? (
              <button
                type="button"
                onClick={() => activate(id)}
                className="text-[0.55rem] uppercase tracking-[0.3em] text-sky-300/90 outline-none transition-colors hover:text-sky-200 focus-visible:text-sky-200"
              >
                Visit →
              </button>
            ) : (
              <span className="text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
                Concept
              </span>
            )}
            {onCompare && navigable && (
              <button
                type="button"
                onClick={() => onCompare(id)}
                className="text-[0.55rem] uppercase tracking-[0.3em] text-white/40 outline-none transition-colors hover:text-white/80"
                title="Compare (coming soon)"
              >
                Compare
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Procedural color thumbnail. Avoids ad-hoc image dependencies while
 * keeping cards visually distinct.
 */
function Thumbnail({ seed }: { seed: string }) {
  // Stable two-tone gradient derived from the entity id.
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const hueA = hash % 360;
  const hueB = (hueA + 60) % 360;
  return (
    <div
      aria-hidden
      className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
      style={{
        background: `radial-gradient(circle at 30% 30%, hsl(${hueA} 70% 55% / 0.85), hsl(${hueB} 50% 18% / 0.95) 75%)`,
        boxShadow: `inset 0 0 12px hsl(${hueA} 80% 60% / 0.25)`,
      }}
    />
  );
}
