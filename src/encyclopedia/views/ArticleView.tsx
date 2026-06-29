import { useEncyclopedia } from "../hooks/useEncyclopedia";
import { useLocale } from "../i18n/useLocale";
import { resolveText } from "../i18n/locale";
import { Markdown } from "../markdown/Markdown";
import { EmptyState, SectionCard } from "../../knowledge/components/blocks";

/**
 * ArticleView — renders the long-form encyclopedia article (markdown
 * sections) for the active entity. Falls back to the KnowledgeEntry's
 * overview field when no encyclopedia article is registered.
 */
export function ArticleView({
  id,
  fallbackOverview,
}: {
  id: string | null;
  fallbackOverview?: string;
}) {
  const { status, content } = useEncyclopedia(id);
  const locale = useLocale();

  if (status === "loading") {
    return <EmptyState message="Loading article…" />;
  }

  const sections = content?.article ?? [];
  if (sections.length === 0) {
    if (fallbackOverview) {
      return <SectionCard title="Overview">{fallbackOverview}</SectionCard>;
    }
    return <EmptyState message="No article registered for this entry yet." />;
  }

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <SectionCard key={s.id} title={resolveText(s.title, locale) || undefined}>
          <Markdown source={resolveText(s.markdown, locale)} />
        </SectionCard>
      ))}
    </div>
  );
}

export default ArticleView;
