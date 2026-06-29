/**
 * Encyclopedia Pack — public API.
 *
 * The encyclopedia layer turns the Knowledge Engine into a complete,
 * multilingual, content-driven encyclopedia. UI surfaces import only
 * from this barrel so the implementation stays free to evolve.
 */
export type {
  Locale,
  LocalizedText,
  ArticleSection,
  GalleryItem,
  TimelineEvent,
  RelatedObjectRef,
  SourceItem,
  EncyclopediaContent,
  ContentLoader,
} from "./types";

export { LocaleState, resolveText, DEFAULT_ENCYCLOPEDIA_LOCALE } from "./i18n/locale";
export { useLocale } from "./i18n/useLocale";

export { EncyclopediaRegistry } from "./registry/EncyclopediaRegistry";

export { Markdown } from "./markdown/Markdown";

export { useEncyclopedia } from "./hooks/useEncyclopedia";

// Section views are exported here for direct use; the Knowledge Panel
// pulls them in via React.lazy() to keep each tab on its own chunk.
export { ArticleView } from "./views/ArticleView";
export { GalleryView } from "./views/GalleryView";
export { TimelineView } from "./views/TimelineView";
export { RelatedView } from "./views/RelatedView";
export { SourcesView } from "./views/SourcesView";
export { FactsView } from "./views/FactsView";
export { CompareView } from "./views/CompareView";
