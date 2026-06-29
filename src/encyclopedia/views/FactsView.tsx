import { useEncyclopedia } from "../hooks/useEncyclopedia";
import { useLocale } from "../i18n/useLocale";
import { resolveText } from "../i18n/locale";
import {
  BulletList,
  EmptyState,
  SectionCard,
} from "../../knowledge/components/blocks";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";

/**
 * FactsView — aggregates "interesting facts" from both the structured
 * KnowledgeEntry and any extra facts declared in EncyclopediaContent.
 */
export function FactsView({ id }: { id: string | null }) {
  const { status, content } = useEncyclopedia(id);
  const locale = useLocale();
  if (status === "loading") return <EmptyState message="Loading facts…" />;

  const entry = id ? KnowledgeRegistry.resolve(id) : undefined;
  const base = entry?.interestingFacts ?? [];
  const extra = (content?.facts ?? []).map((t) => resolveText(t, locale));
  const items = [...base, ...extra].filter(Boolean);
  if (items.length === 0)
    return <EmptyState message="No facts registered for this entry yet." />;

  return (
    <SectionCard title="Interesting facts">
      <BulletList items={items} />
    </SectionCard>
  );
}

export default FactsView;
