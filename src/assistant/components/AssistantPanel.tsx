import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { askAssistant } from "../engine/StubProvider";
import { snapshotAssistantContext } from "../engine/context";
import type { AssistantMessage } from "../types";

/**
 * AssistantPanel — chat surface for the AI Astronomer.
 *
 * UI only: messages are routed through the active provider (Stub by
 * default). A backend can be plugged in later via setAssistantProvider.
 */
export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const user: AssistantMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, user]);
    setInput("");
    setBusy(true);
    try {
      const reply = await askAssistant([...messages, user], snapshotAssistantContext());
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto fixed bottom-3 right-16 z-40 flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3.5 text-[0.68rem] uppercase tracking-[0.25em] text-white/80 backdrop-blur-md hover:text-white"
        aria-label="Open AI Astronomer"
      >
        <Sparkles size={14} /> Astronomer
      </button>
      {open && (
        <div className="pointer-events-auto fixed bottom-16 right-3 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 text-white shadow-xl backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
              <MessageCircle size={14} /> AI Astronomer
            </span>
            <button onClick={() => setOpen(false)} className="text-white/55 hover:text-white" aria-label="Close">
              <X size={14} />
            </button>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-[0.82rem] leading-relaxed">
            {messages.length === 0 && (
              <p className="text-white/55">
                Ask me about the object you're currently observing. I draw only on the data registered in this app — no
                guessing.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "self-end max-w-[85%] rounded-xl bg-white/10 px-3 py-2" : "self-start max-w-[90%]"}>
                  <Markdown text={m.content} />
                </div>
              ))}
              {busy && <div className="self-start text-white/45">Thinking…</div>}
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-white/10 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the focused object…"
              className="flex-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** Tiny inline markdown — supports **bold** and bullet lines. */
function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.trimStart().startsWith("•")) {
          return (
            <ul key={i} className="ml-1 list-disc pl-3">
              {b.split("\n").map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^•\s?/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mb-2 last:mb-0">
            {renderInline(b)}
          </p>
        );
      })}
    </>
  );
}

function renderInline(s: string): React.ReactNode[] {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="text-white">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
