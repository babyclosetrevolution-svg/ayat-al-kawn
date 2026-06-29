import { useScienceParam } from "../hooks/useScienceParam";
import type { ToggleControl } from "../types";

/**
 * Toggle — boolean control bound to a science parameter.
 */
export function Toggle({ spec }: { spec: ToggleControl }) {
  const [value, setValue] = useScienceParam(spec.paramKey, spec.defaultValue);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[0.78rem] font-light text-white/85">
          {spec.label}
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => setValue(!value)}
          className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
            value
              ? "border-sky-300/60 bg-sky-300/30"
              : "border-white/15 bg-white/5"
          }`}
        >
          <span
            aria-hidden
            className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              value ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {spec.note && (
        <p className="text-[0.7rem] font-light leading-snug text-white/50">
          {spec.note}
        </p>
      )}
    </div>
  );
}
