import type { AssistantContext, AssistantMessage, AssistantProvider } from "../types";
import { KnowledgeRegistry } from "../../knowledge/registry/KnowledgeRegistry";

/**
 * StubProvider — grounded, deterministic answers built only from the
 * Knowledge Engine. No external calls, no hallucinated metadata: if we
 * don't have the data we say so. A real model provider can replace this
 * by implementing the same interface.
 */
export const StubProvider: AssistantProvider = {
  id: "stub",
  async send(messages, ctx) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    const question = last?.content?.trim() ?? "";
    await new Promise((r) => setTimeout(r, 350)); // tiny pacing for UX

    if (!ctx.focusId) {
      return "Pick a celestial body in the Explorer panel and I'll tell you what we know about it.";
    }
    const entry = KnowledgeRegistry.resolve(ctx.focusId);
    if (!entry) {
      return `I don't have a knowledge entry registered for "${ctx.focusId}" yet.`;
    }

    const intro = `**${entry.name}** — ${entry.summary ?? ""}`.trim();
    const detail = pickDetailFromEntry(entry, question);
    const tail = ctx.comparison
      ? `\n\nYou're currently comparing: ${ctx.comparison.ids.join(", ")} (${ctx.comparison.kind}).`
      : "";
    return [intro, detail].filter(Boolean).join("\n\n") + tail;
  },
};

function pickDetailFromEntry(entry: ReturnType<typeof KnowledgeRegistry.resolve>, question: string): string {
  if (!entry) return "";
  const q = question.toLowerCase();
  type Pair = { label: string; value: string };
  const pairs: Pair[] = [];
  type Stats = Record<string, string | number | undefined>;
  const stats = (entry as unknown as { stats?: Stats }).stats ?? {};
  for (const [k, v] of Object.entries(stats)) {
    if (v == null) continue;
    pairs.push({ label: k, value: String(v) });
  }
  if (pairs.length === 0) return "";
  const matched = pairs.find((p) => q.includes(p.label.toLowerCase()));
  const chosen = matched ?? pairs.slice(0, 4);
  if (Array.isArray(chosen)) {
    return chosen.map((p) => `• **${p.label}** — ${p.value}`).join("\n");
  }
  return `• **${chosen.label}** — ${chosen.value}`;
}

let activeProvider: AssistantProvider = StubProvider;

export function setAssistantProvider(p: AssistantProvider): void {
  activeProvider = p;
}

export function getAssistantProvider(): AssistantProvider {
  return activeProvider;
}

export async function askAssistant(messages: AssistantMessage[], ctx: AssistantContext): Promise<string> {
  return activeProvider.send(messages, ctx);
}
