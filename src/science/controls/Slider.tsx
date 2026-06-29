import { useScienceParam } from "../hooks/useScienceParam";
import type { SliderControl } from "../types";

/**
 * Slider — generic numeric control bound to a science parameter.
 * Renders named anchor ticks underneath when supplied.
 */
export function Slider({ spec }: { spec: SliderControl }) {
  const [value, setValue] = useScienceParam(spec.paramKey, spec.defaultValue);
  const step = spec.step ?? (spec.max - spec.min) / 100;
  const display = formatValue(value, step, spec.unit);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[0.78rem] font-light text-white/85">
          {spec.label}
        </label>
        <span className="tabular-nums text-[0.72rem] font-light text-sky-300/90">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={spec.min}
        max={spec.max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="science-slider w-full"
        aria-label={spec.label}
      />
      {spec.ticks && (
        <div className="flex justify-between text-[0.55rem] uppercase tracking-[0.25em] text-white/35">
          {spec.ticks.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue(t.value)}
              className="rounded outline-none transition-colors hover:text-white focus-visible:text-white"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {spec.note && (
        <p className="text-[0.7rem] font-light leading-snug text-white/50">
          {spec.note}
        </p>
      )}
    </div>
  );
}

function formatValue(value: number, step: number, unit?: string): string {
  const decimals = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
  return `${value.toFixed(decimals)}${unit ?? ""}`;
}
