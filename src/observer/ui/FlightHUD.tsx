import { useFlightState } from "../flight/useFlightState";
import type { FlightTier } from "../flight/types";

/**
 * FlightHUD — tiny always-visible pill that surfaces two things while the
 * user is flying the Observer:
 *   - current adaptive speed tier
 *   - whether an object is focused (journey / observation) or the Observer
 *     is in free flight
 *
 * Read-only. Never captures pointer events. Pairs with the ObserverHUD but
 * lives on the bottom edge so it stays out of the way of the top-left
 * kinematics readout and the top-right replay button.
 */

const TIER_LABEL: Record<FlightTier, string> = {
  "very-slow": "Very slow",
  medium: "Medium",
  fast: "Fast",
  "very-fast": "Very fast",
};

const TIER_ACCENT: Record<FlightTier, string> = {
  "very-slow": "text-sky-200/85 border-sky-200/25",
  medium: "text-white/85 border-white/20",
  fast: "text-amber-100/90 border-amber-100/25",
  "very-fast": "text-fuchsia-200/90 border-fuchsia-200/25",
};

interface Props {
  visible: boolean;
}

export function FlightHUD({ visible }: Props) {
  const { tier, focused, translating, speed } = useFlightState();

  if (!visible) return null;

  const focusLabel = focused ? "Focused" : "Free flight";
  const focusClass = focused
    ? "text-amber-200/90 border-amber-200/30"
    : "text-white/75 border-white/15";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 22px)" }}
      aria-hidden
    >
      <div
        className={`flex items-center gap-2 rounded-full border bg-black/40 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] backdrop-blur-md transition-opacity duration-500 ${
          translating || focused ? "opacity-95" : "opacity-55"
        }`}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${TIER_ACCENT[tier]}`}
          title={`Adaptive tier · ${speed.toFixed(1)} u/s`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "currentColor" }}
          />
          {TIER_LABEL[tier]}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${focusClass}`}
        >
          {focusLabel}
        </span>
      </div>
    </div>
  );
}
