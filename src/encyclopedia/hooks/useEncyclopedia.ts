import { useEffect, useState } from "react";
import { EncyclopediaRegistry } from "../registry/EncyclopediaRegistry";
import type { EncyclopediaContent } from "../types";

export type EncyclopediaStatus = "idle" | "loading" | "ready" | "empty";

export interface EncyclopediaQuery {
  status: EncyclopediaStatus;
  content: EncyclopediaContent | null;
}

/**
 * Lazily loads the encyclopedia content for a given entity id.
 *
 * Sections call this hook only when their tab opens, so payloads — and
 * any code-split chunks behind them — are pulled in on demand.
 */
export function useEncyclopedia(id: string | null | undefined): EncyclopediaQuery {
  const [state, setState] = useState<EncyclopediaQuery>(() => {
    if (!id) return { status: "idle", content: null };
    const peek = EncyclopediaRegistry.peek(id);
    if (peek) return { status: "ready", content: peek };
    return {
      status: EncyclopediaRegistry.has(id) ? "loading" : "empty",
      content: null,
    };
  });

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setState({ status: "idle", content: null });
      return;
    }
    const peek = EncyclopediaRegistry.peek(id);
    if (peek) {
      setState({ status: "ready", content: peek });
      return;
    }
    if (!EncyclopediaRegistry.has(id)) {
      setState({ status: "empty", content: null });
      return;
    }
    setState({ status: "loading", content: null });
    EncyclopediaRegistry.load(id).then((c) => {
      if (cancelled) return;
      setState({ status: c ? "ready" : "empty", content: c ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
