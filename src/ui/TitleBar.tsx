import { BRAND } from "../core/config";

/**
 * TitleBar — minimal in-experience header.
 * Sits over the canvas without intercepting pointer events.
 */
export function TitleBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-6 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <h1 className="text-[0.7rem] uppercase tracking-[0.55em] text-white/55">
        {BRAND.title}
      </h1>
    </div>
  );
}
