import { useState } from "react";
import { useEncyclopedia } from "../hooks/useEncyclopedia";
import { useLocale } from "../i18n/useLocale";
import { resolveText } from "../i18n/locale";
import { EmptyState, SectionCard } from "../../knowledge/components/blocks";

/**
 * GalleryView — masonry-light grid of images registered for the entity.
 * Independent module: never imports rendering, simulation, or knowledge
 * registries. Clicking a thumbnail opens a lightweight lightbox overlay.
 */
export function GalleryView({ id }: { id: string | null }) {
  const { status, content } = useEncyclopedia(id);
  const locale = useLocale();
  const [active, setActive] = useState<number | null>(null);

  if (status === "loading") return <EmptyState message="Loading gallery…" />;
  const items = content?.gallery ?? [];
  if (items.length === 0)
    return <EmptyState message="No gallery images registered for this entry." />;

  return (
    <SectionCard title="Gallery">
      <div className="grid grid-cols-2 gap-2">
        {items.map((it, idx) => (
          <button
            key={`${it.src}-${idx}`}
            type="button"
            onClick={() => setActive(idx)}
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 outline-none transition-transform duration-300 hover:scale-[1.01] focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <img
              src={it.src}
              alt={resolveText(it.alt, locale)}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
            />
            {it.caption && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-[0.65rem] font-light tracking-wide text-white/85">
                {resolveText(it.caption, locale)}
              </span>
            )}
          </button>
        ))}
      </div>

      {active !== null && items[active] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <figure className="flex max-h-full max-w-3xl flex-col items-center gap-3">
            <img
              src={items[active].src}
              alt={resolveText(items[active].alt, locale)}
              className="max-h-[78vh] w-auto rounded-lg shadow-2xl"
            />
            {(items[active].caption || items[active].credit) && (
              <figcaption className="text-center text-[0.78rem] font-light text-white/75">
                {resolveText(items[active].caption, locale)}
                {items[active].credit && (
                  <span className="ml-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/40">
                    © {items[active].credit}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </SectionCard>
  );
}

export default GalleryView;
