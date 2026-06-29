import { ObservatoryState } from "../state";
import { useObservatoryState } from "../useObservatoryState";

/**
 * ModeSwitcher — pill toggle between Explore Universe and Observe My Sky.
 * Sits at the top center, above the canvas.
 */
export function ModeSwitcher() {
  const s = useObservatoryState();
  const Btn = ({ value, label }: { value: "universe" | "observatory"; label: string }) => {
    const active = s.mode === value;
    return (
      <button
        type="button"
        onClick={() => ObservatoryState.setMode(value)}
        aria-pressed={active}
        className={`px-3.5 py-1.5 text-[0.68rem] uppercase tracking-[0.25em] transition-colors ${
          active ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="pointer-events-auto fixed left-1/2 top-3 z-40 -translate-x-1/2 overflow-hidden rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
      <Btn value="universe" label="Explore Universe" />
      <Btn value="observatory" label="Observe My Sky" />
    </div>
  );
}
