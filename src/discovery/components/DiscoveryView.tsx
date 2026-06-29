import { useState } from "react";
import {
  useActiveFocus,
  useBreadcrumb,
  useContinueExploring,
  useHistory,
  useLearningPaths,
  useRelatedObjects,
  useScientificTopics,
  activate,
} from "../hooks/useDiscovery";
import { DiscoveryCard } from "./DiscoveryCard";
import { DiscoverySection } from "./DiscoverySection";
import { Breadcrumb } from "./Breadcrumb";
import type { LearningPath, Suggestion } from "../types";

/**
 * DiscoveryView — composite surface rendered inside the Knowledge panel as
 * its own tab. Pure composition over the discovery hooks.
 *
 * `onCompareRequest` is the Phase-13 entry point: today it only emits the
 * intent (toasts handled by the host), no comparison view exists yet.
 */
export function DiscoveryView({
  onCompareRequest,
}: {
  onCompareRequest?: (id: string) => void;
}) {
  const id = useActiveFocus();
  const trail = useBreadcrumb(id);
  const related = useRelatedObjects(id);
  const topics = useScientificTopics(id);
  const continueList = useContinueExploring(id, 8);
  const history = useHistory();
  const paths = useLearningPaths();

  return (
    <div>
      <Breadcrumb trail={trail} />

      <DiscoverySection title="Related" empty={related.length === 0}>
        <Cards items={related} onCompare={onCompareRequest} />
      </DiscoverySection>

      <DiscoverySection title="Scientific topics" empty={topics.length === 0}>
        <Cards items={topics} />
      </DiscoverySection>

      <DiscoverySection
        title="Continue exploring"
        empty={continueList.length === 0}
      >
        <Cards items={continueList} onCompare={onCompareRequest} />
      </DiscoverySection>

      <DiscoverySection title="Learning paths">
        <div className="space-y-2">
          {paths.map((p) => (
            <PathRow key={p.id} path={p} activeId={id} />
          ))}
        </div>
      </DiscoverySection>

      <DiscoverySection title="Recently visited" empty={history.length === 0}>
        <ul className="grid grid-cols-2 gap-1.5">
          {history.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => activate(h.id)}
                className="w-full truncate rounded-md border border-white/8 px-2 py-1.5 text-left text-[0.72rem] font-light text-white/70 outline-none transition-colors hover:border-white/25 hover:text-white focus-visible:border-white/40"
              >
                {h.title}
              </button>
            </li>
          ))}
        </ul>
      </DiscoverySection>
    </div>
  );
}

function Cards({
  items,
  onCompare,
}: {
  items: Suggestion[];
  onCompare?: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((s) => (
        <DiscoveryCard key={s.id} suggestion={s} onCompare={onCompare} />
      ))}
    </div>
  );
}

function PathRow({ path, activeId }: { path: LearningPath; activeId: string | null }) {
  const [open, setOpen] = useState(false);
  const idx = activeId ? path.steps.indexOf(activeId) : -1;
  const progress = idx >= 0 ? (idx + 1) / path.steps.length : 0;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-white/30"
      >
        <div className="min-w-0">
          <div className="text-[0.85rem] font-light text-white">{path.title}</div>
          <div className="mt-0.5 line-clamp-1 text-[0.7rem] font-light text-white/50">
            {path.summary}
          </div>
        </div>
        <span className="text-[0.55rem] uppercase tracking-[0.3em] text-white/40">
          {open ? "Hide" : "Open"}
        </span>
      </button>
      <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full bg-sky-300/80 transition-all duration-700"
          style={{ width: `${Math.max(progress * 100, 4)}%` }}
        />
      </div>
      {open && (
        <ol className="mt-3 space-y-1">
          {path.steps.map((step, i) => {
            const active = step === activeId;
            return (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => activate(step)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[0.78rem] outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/30 ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-[0.6rem] tabular-nums text-white/35">
                    {i + 1}
                  </span>
                  <span className="truncate">{step.replace(/^topic:/, "")}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
