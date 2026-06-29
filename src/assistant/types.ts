/**
 * AI Astronomer — shared types.
 *
 * The assistant is UI-only for now. A provider abstraction is exposed so
 * a backend (Lovable AI Gateway, local model, etc.) can plug in later
 * without touching the chat surface.
 */
export interface AssistantContext {
  /** Currently focused celestial body id, if any. */
  focusId: string | null;
  focusName?: string;
  focusSummary?: string;
  comparison?: { kind: string; ids: string[] };
  discoveryTopic?: string;
  observatoryMode: boolean;
  locale: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** When the assistant is awaiting a provider, this is true. */
  pending?: boolean;
}

export interface AssistantProvider {
  /** Stable identifier — "stub", "lovable-ai", etc. */
  id: string;
  send(messages: AssistantMessage[], ctx: AssistantContext): Promise<string>;
}
