import { BRAND } from "../core/config";
import { useUIState } from "./hooks/useUIState";

/**
 * TitleBar — minimal in-experience header that recedes when the user
 * actively navigates or the camera is in cinematic motion.
 */
export function TitleBar({ visible }: { visible: boolean }) {
  const ui = useUIState();
  const recede =
    ui.activity === "navigating" || ui.activity === "cinematic";
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-6 transition-opacity duration-700 ${
        visible ? (recede ? "opacity-20" : "opacity-100") : "opacity-0"
      }`}
    >
      <h1 className="text-[0.7rem] uppercase tracking-[0.55em] text-white/55">
        {BRAND.title}
      </h1>
    </div>
  );
}
