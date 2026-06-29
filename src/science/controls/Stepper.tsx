import { useScienceParam } from "../hooks/useScienceParam";
import type { StepperControl } from "../types";

/**
 * Stepper — segmented selector. One pill per option.
 */
export function Stepper({ spec }: { spec: StepperControl }) {
  const [value, setValue] = useScienceParam(spec.paramKey, spec.defaultValue);
  return (
    <div className="space-y-2">
      <label className="block text-[0.78rem] font-light text-white/85">
        {spec.label}
      </label>
      <div role="radiogroup" className="flex flex-wrap gap-1.5">
        {spec.options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => setValue(opt.value)}
              className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                active
                  ? "border-sky-300/60 bg-sky-300/15 text-sky-100"
                  : "border-white/12 bg-white/[0.03] text-white/55 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {spec.note && (
        <p className="text-[0.7rem] font-light leading-snug text-white/50">
          {spec.note}
        </p>
      )}
    </div>
  );
}
