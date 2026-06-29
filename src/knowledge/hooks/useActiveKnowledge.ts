import { useEffect, useState } from "react";
import { FocusRegistry, type FocusKey } from "../../world/state/focus";
import { KnowledgeRegistry } from "../registry/KnowledgeRegistry";
import type { KnowledgeEntry } from "../types/KnowledgeEntry";

/**
 * Subscribes to the active focus id and resolves it through the
 * KnowledgeRegistry. Returns the matching entry or `undefined`.
 *
 * The Knowledge Engine reads from the FocusRegistry but never writes to it,
 * keeping a one-way data flow: Explorer → Focus → Knowledge.
 */
export function useActiveKnowledge(): {
  id: FocusKey;
  entry: KnowledgeEntry | undefined;
} {
  const [id, setId] = useState<FocusKey>(FocusRegistry.getActive());
  useEffect(() => FocusRegistry.subscribe(setId), []);
  return { id, entry: KnowledgeRegistry.resolve(id) };
}
