/**
 * Encyclopedia Pack — shared types.
 *
 * The encyclopedia layer extends the Knowledge Engine with long-form,
 * multilingual, content-driven articles. Nothing here is hardcoded copy
 * for a particular body — modules register content providers and the
 * UI renders whatever was registered.
 *
 * Localization model
 * ------------------
 * Every user-facing string is a `LocalizedText`: either a plain string
 * (treated as the default locale) or a partial map keyed by locale. The
 * resolver falls back to the default locale, then to any available
 * translation, so partial translations render gracefully.
 */

export type Locale = "en" | "ar" | "fr" | "es";

export type LocalizedText = string | Partial<Record<Locale, string>>;

/** A discrete chunk of long-form, markdown-formatted content. */
export interface ArticleSection {
  /** Stable identifier — e.g. "overview", "formation", "atmosphere". */
  id: string;
  title?: LocalizedText;
  /** Markdown body. Renderer supports headings, bold, italic, lists, links, code. */
  markdown: LocalizedText;
}

export interface GalleryItem {
  /** Image URL — local asset path or absolute URL. */
  src: string;
  alt?: LocalizedText;
  caption?: LocalizedText;
  credit?: string;
}

export interface TimelineEvent {
  year: number | string;
  title: LocalizedText;
  description?: LocalizedText;
  /** Optional grouping label (e.g. "Observation", "Mission"). */
  category?: string;
}

export interface RelatedObjectRef {
  /** Id resolvable by KnowledgeRegistry / FocusRegistry. */
  id: string;
  note?: LocalizedText;
}

export interface SourceItem {
  title: LocalizedText;
  url?: string;
  source?: string;
}

/** Full content payload for a single encyclopedia entry. */
export interface EncyclopediaContent {
  id: string;
  /** Optional long-form article — markdown sections. */
  article?: ArticleSection[];
  gallery?: GalleryItem[];
  timeline?: TimelineEvent[];
  /** Curated related-object overrides; otherwise Discovery graph is used. */
  related?: RelatedObjectRef[];
  /** Encyclopedia-level sources (distinct from per-entry scientific references). */
  sources?: SourceItem[];
  /** Additional facts surfaced under the Interesting Facts tab. */
  facts?: LocalizedText[];
}

/**
 * Lazy content loader. Implementations may return an inline object, a
 * dynamically imported chunk, or a fetched JSON payload — every section
 * therefore loads on demand.
 */
export type ContentLoader = () => Promise<EncyclopediaContent>;
