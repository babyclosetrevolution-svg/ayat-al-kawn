import { BRAND } from "../core/config";

interface TitleScreenProps {
  visible: boolean;
  onBegin: () => void;
}

/**
 * TitleScreen — minimal dark entry UI.
 * Renders above the Engine as a transparent overlay so the starfield
 * is visible behind the title from the very first frame.
 */
export function TitleScreen({ visible, onBegin }: TitleScreenProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-[1400ms] ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-10 text-center">
        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-extralight tracking-[0.35em] text-white/90">
          {BRAND.title}
        </h1>
        <p className="max-w-xl text-[0.72rem] uppercase tracking-[0.4em] text-white/40">
          {BRAND.subtitle}
        </p>
        <button
          type="button"
          onClick={onBegin}
          className="pointer-events-auto mt-6 border border-white/25 px-10 py-3 text-[0.65rem] uppercase tracking-[0.45em] text-white/70 transition-colors duration-500 hover:border-white/70 hover:text-white"
        >
          Begin Exploration
        </button>
      </div>
      <div className="absolute bottom-6 text-[0.55rem] uppercase tracking-[0.5em] text-white/25">
        v1.0 · Phase I — Engine Foundation
      </div>
    </div>
  );
}
