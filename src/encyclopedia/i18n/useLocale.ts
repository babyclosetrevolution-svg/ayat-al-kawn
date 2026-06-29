import { useEffect, useState } from "react";
import { LocaleState } from "./locale";
import type { Locale } from "../types";

/** Subscribe to the active encyclopedia locale. */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(() => LocaleState.get());
  useEffect(() => LocaleState.subscribe(setLocale), []);
  return locale;
}
