import { useEncyclopedia } from "../hooks/useEncyclopedia";
import { useLocale } from "../i18n/useLocale";
import { resolveText } from "../i18n/locale";
import { EmptyState, SectionCard } from "../../knowledge/components/blocks";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";
import { FocusRegistry } from "../../world/state/focus";
import { DiscoveryGraph } from "../../discovery/registry/graph";

/**
 * RelatedView — curated related objects, falling back to the Discovery
 * graph when no curated list is registered. Clicking an item focuses
 * the camera through the existing FocusRegistry.
 */
export function RelatedView({ id }: { id: string | null }) {
  const { status, content } = useEncyclopedia(id);
  const locale = useLocale();
  if (status === "loading") return <EmptyState message="Loading related objects…" />;
  if (!id) return <EmptyState message="Select an object to see related entries." />;

  const curated = content?.related ?? [];
  let items: { id: string; note?: string }[];
  if (curated.length) {
    items = curated.map((r) => ({ id: r.id, note: resolveText(r.note, locale) }));
  } else {
    const seen = new Set<string>();
    items = DiscoveryGraph.relations(id)
      .filter((r) => ["satellite", "parent", "similar", "neighbor", "child"].includes(r.kind))
      .filter((r) => {
        if (seen.has(r.to)) return false;
        seen.add(r.to);
        return true;
      })
      .slice(0, 12)
      .map((r) => ({ id: r.to, note: r.reason }));
  }

  if (items.length === 0)
    return <EmptyState message="No related objects registered for this entry." />;

  return (
    <SectionCard title="Related objects">
      <ul className="space-y-1.5">
        {items.map(({ id: rid, note }) => {
          const entry = KnowledgeRegistry.resolve(rid);
          const title = entry?.title ?? rid;
          const subtitle = entry?.subtitle ?? entry?.category ?? "";
          const focusable = !!FocusRegistry.get(rid);
          return (
            <li key={rid}>
              <button
                type="button"
                disabled={!focusable}
                onClick={() => focusable && FocusRegistry.setActive(rid)}
                className={`group flex w-full items-start gap-3 rounded-lg border border-white/8 px-3 py-2 text-left transition-colors ${
                  focusable
                    ? "hover:border-white/20 hover:bg-white/5"
                    : "cursor-default opacity-70"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    focusable ? "bg-sky-300/80" : "bg-white/20"
                  }`}
                />
                <span className="flex-1">
                  <span className="block text-[0.88rem] text-white">{title}</span>
                  {(note || subtitle) && (
                    <span className="block text-[0.7rem] font-light text-white/50">
                      {note || subtitle}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export default RelatedView;
