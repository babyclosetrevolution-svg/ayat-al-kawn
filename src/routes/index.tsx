import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

// R3F + Three.js are browser-only; load on the client.
const AyatApp = lazy(() =>
  import("../components/AyatApp.client").then((m) => ({ default: m.AyatApp })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AYAT AL-KAWN — An Interactive Journey Through the Universe" },
      {
        name: "description",
        content:
          "An immersive 3D platform to explore, understand and contemplate the known Universe.",
      },
      { property: "og:title", content: "AYAT AL-KAWN" },
      {
        property: "og:description",
        content: "An interactive journey through the Universe.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      {mounted ? (
        <Suspense fallback={null}>
          <AyatApp />
        </Suspense>
      ) : null}
    </main>
  );
}
