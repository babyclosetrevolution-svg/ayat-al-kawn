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

    const intro = `**${entry.title}** — ${entry.overview ?? ""}`.trim();
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
  const pairs: { label: string; value: string }[] = [];
  for (const f of entry.quickFacts ?? []) pairs.push({ label: f.label, value: `${f.value}${f.unit ? " " + f.unit : ""}` });
  for (const f of entry.physicalProperties ?? []) pairs.push({ label: f.label, value: f.value });
  if (pairs.length === 0 && entry.interestingFacts?.length) {
    return entry.interestingFacts.slice(0, 3).map((f) => `• ${f}`).join("\n");
  }
  const matched = pairs.find((p) => q.includes(p.label.toLowerCase()));
  const chosen = matched ? [matched] : pairs.slice(0, 4);
  return chosen.map((p) => `• **${p.label}** — ${p.value}`).join("\n");
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
