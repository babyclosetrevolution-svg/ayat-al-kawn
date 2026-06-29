import { useEncyclopedia } from "../hooks/useEncyclopedia";
import { useLocale } from "../i18n/useLocale";
import { resolveText } from "../i18n/locale";
import { EmptyState, SectionCard } from "../../knowledge/components/blocks";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";

/**
 * TimelineView — vertical chronology of events related to the entity.
 *
 * Reads from EncyclopediaContent.timeline first; falls back to the
 * KnowledgeEntry.exploration.timeline (already shipped on many bodies)
 * so existing data lights up the new tab automatically.
 */
export function TimelineView({ id }: { id: string | null }) {
  const { status, content } = useEncyclopedia(id);
  const locale = useLocale();
  if (status === "loading") return <EmptyState message="Loading timeline…" />;

  const fromContent = content?.timeline ?? [];
  const entry = id ? KnowledgeRegistry.resolve(id) : undefined;
  const fromKnowledge =
    entry?.exploration?.timeline?.map((e) => ({
      year: e.year,
      title: e.mission,
      description: e.note,
      category: e.agency,
    })) ?? [];

  const events = fromContent.length ? fromContent : fromKnowledge;
  if (events.length === 0)
    return <EmptyState message="No timeline events registered for this entry." />;

  return (
    <SectionCard title="Timeline">
      <ol className="relative space-y-3 border-l border-white/10 pl-5">
        {events.map((e, i) => (
          <li
            key={i}
            className="relative text-[0.88rem] font-light text-white/80"
          >
            <span
              aria-hidden
              className="absolute -left-[1.4rem] top-1.5 h-1.5 w-1.5 rounded-full bg-sky-300/70"
            />
            <span className="mr-2 text-white/45">{e.year}</span>
            <span className="text-white">
              {typeof e.title === "string" ? e.title : resolveText(e.title, locale)}
            </span>
            {e.category && (
              <span className="ml-2 text-[0.6rem] uppercase tracking-[0.25em] text-white/40">
                {e.category}
              </span>
            )}
            {e.description && (
              <div className="mt-0.5 text-white/55">
                {typeof e.description === "string"
                  ? e.description
                  : resolveText(e.description, locale)}
              </div>
            )}
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

export default TimelineView;
