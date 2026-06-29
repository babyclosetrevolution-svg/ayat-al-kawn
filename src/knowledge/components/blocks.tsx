import type { ReactNode } from "react";
import type {
  KeyedFact,
  QuickFact,
  Reference,
} from "../types/KnowledgeEntry";

/**
 * Reusable presentation blocks for the Knowledge Panel.
 * Pure UI — no data fetching, no engine coupling. Sections become a matter
 * of composition; future modules reuse the same blocks for consistency.
 */

export function HeroHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className="px-7 pb-6 pt-8">
      {eyebrow && (
        <div className="mb-2 text-[0.6rem] uppercase tracking-[0.5em] text-white/45">
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl font-light tracking-tight text-white">{title}</h2>
      {subtitle && (
        <p className="mt-1.5 text-sm font-light text-white/55">{subtitle}</p>
      )}
    </header>
  );
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-7 py-5">
      <h3 className="mb-3 text-[0.6rem] uppercase tracking-[0.4em] text-white/45">
        {title}
      </h3>
      <div className="text-[0.92rem] leading-relaxed font-light text-white/80">
        {children}
      </div>
    </section>
  );
}

export function StatGrid({ items }: { items: QuickFact[] }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 px-7 pb-2">
      {items.map((f) => (
        <div
          key={f.label}
          className="rounded-xl border border-white/8 bg-white/5 px-3 py-2.5"
        >
          <div className="text-[0.55rem] uppercase tracking-[0.35em] text-white/45">
            {f.label}
          </div>
          <div className="mt-1 text-sm font-light text-white">
            {f.value}
            {f.unit && (
              <span className="ml-1 text-xs text-white/45">{f.unit}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FactList({ items }: { items: KeyedFact[] }) {
  if (!items.length) return null;
  return (
    <dl className="divide-y divide-white/8 rounded-xl border border-white/8 bg-white/3">
      {items.map((f) => (
        <div
          key={f.label}
          className="flex items-baseline justify-between gap-4 px-4 py-2.5"
        >
          <dt className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45">
            {f.label}
          </dt>
          <dd className="text-right text-[0.85rem] font-light text-white/85">
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[0.9rem] font-light text-white/75">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/40" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReferenceSection({ items }: { items: Reference[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((r, i) => (
        <li key={i} className="text-[0.85rem] font-light">
          {r.url ? (
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="text-white/75 underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              {r.title}
            </a>
          ) : (
            <span className="text-white/75">{r.title}</span>
          )}
          {r.source && (
            <span className="ml-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/35">
              {r.source}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-7 py-12 text-center text-sm font-light text-white/40">
      {message}
    </div>
  );
}
