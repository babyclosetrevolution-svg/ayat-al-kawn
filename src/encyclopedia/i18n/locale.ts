import type { Locale, LocalizedText } from "../types";

/**
 * LocaleState — observable current locale.
 *
 * The encyclopedia is fully multilingual: every component reads through
 * `resolveText` and re-renders when the locale changes. Defaulting to "en"
 * keeps existing copy working unchanged.
 */
const DEFAULT_LOCALE: Locale = "en";

class LocaleStateImpl {
  private current: Locale = DEFAULT_LOCALE;
  private subs = new Set<(locale: Locale) => void>();

  get(): Locale {
    return this.current;
  }

  set(locale: Locale): void {
    if (locale === this.current) return;
    this.current = locale;
    for (const s of this.subs) s(locale);
  }

  subscribe(fn: (locale: Locale) => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}

export const LocaleState = new LocaleStateImpl();

/**
 * Resolve a `LocalizedText` to a plain string for the active (or given)
 * locale, falling back to English then to any other available translation.
 */
export function resolveText(
  text: LocalizedText | undefined,
  locale: Locale = LocaleState.get(),
): string {
  if (text == null) return "";
  if (typeof text === "string") return text;
  return (
    text[locale] ??
    text[DEFAULT_LOCALE] ??
    // Last resort: first defined string in the record.
    Object.values(text).find((v): v is string => typeof v === "string") ??
    ""
  );
}

export const DEFAULT_ENCYCLOPEDIA_LOCALE = DEFAULT_LOCALE;
