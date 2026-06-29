import { activate } from "../hooks/useDiscovery";
import type { Crumb } from "../engine/breadcrumb";

/**
 * Lightweight navigation trail. Tapping a crumb returns to that context.
 * The synthetic "Universe" crumb is non-interactive for now (no root view).
 */
export function Breadcrumb({ trail }: { trail: Crumb[] }) {
  if (trail.length <= 1) return null;
  return (
    <nav aria-label="Trail" className="flex flex-wrap items-center gap-1 px-5 py-2 text-[0.55rem] uppercase tracking-[0.3em] text-white/45">
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        const interactive = !last && c.id !== "universe";
        return (
          <span key={c.id} className="flex items-center gap-1">
            {interactive ? (
              <button
                type="button"
                onClick={() => activate(c.id)}
                className="rounded outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-1 focus-visible:ring-white/40"
              >
                {c.title}
              </button>
            ) : (
              <span className={last ? "text-white/80" : "text-white/30"}>
                {c.title}
              </span>
            )}
            {!last && <span aria-hidden className="text-white/20">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
