import { useEncyclopedia } from "../hooks/useEncyclopedia";
import { useLocale } from "../i18n/useLocale";
import { resolveText } from "../i18n/locale";
import { EmptyState, SectionCard, ReferenceSection } from "../../knowledge/components/blocks";

/**
 * SourcesView — encyclopedia-level credits and citations. Distinct from
 * the scientific References tab so editors can credit images, narrative
 * authors, or institutional sources without polluting the references list.
 */
export function SourcesView({ id }: { id: string | null }) {
  const { status, content } = useEncyclopedia(id);
  const locale = useLocale();
  if (status === "loading") return <EmptyState message="Loading sources…" />;
  const sources = content?.sources ?? [];
  if (sources.length === 0)
    return <EmptyState message="No sources registered for this entry." />;

  return (
    <SectionCard title="Sources">
      <ReferenceSection
        items={sources.map((s) => ({
          title: resolveText(s.title, locale),
          url: s.url,
          source: s.source,
        }))}
      />
    </SectionCard>
  );
}

export default SourcesView;
