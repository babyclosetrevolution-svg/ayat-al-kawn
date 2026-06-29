import { useCallback, useEffect, useState } from "react";
import { ScienceParams } from "../state/params";
import type { ParamValue } from "../types";

/**
 * useScienceParam — subscribe to a science parameter and write to it.
 *
 * Registers the supplied default on mount so the store can reset to it
 * later, then re-renders whenever the value changes.
 */
export function useScienceParam<T extends ParamValue>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() =>
    ScienceParams.get<T>(key, defaultValue),
  );

  useEffect(() => {
    ScienceParams.registerDefault(key, defaultValue);
    // Sync local state with whatever is currently stored.
    setValue(ScienceParams.get<T>(key, defaultValue));
    return ScienceParams.subscribe(key, (v) => setValue(v as T));
    // defaultValue is intentionally excluded — only the first call wins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setter = useCallback(
    (next: T) => ScienceParams.set(key, next),
    [key],
  );

  return [value, setter];
}
