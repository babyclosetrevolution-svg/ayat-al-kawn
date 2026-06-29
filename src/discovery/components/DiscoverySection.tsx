import type { ReactNode } from "react";

export function DiscoverySection({
  title,
  children,
  empty,
}: {
  title: string;
  children: ReactNode;
  empty?: boolean;
}) {
  if (empty) return null;
  return (
    <section className="px-5 py-4">
      <h3 className="mb-3 text-[0.55rem] uppercase tracking-[0.4em] text-white/40">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
