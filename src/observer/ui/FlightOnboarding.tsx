import { useEffect, useState } from "react";
import { useIsTouchDevice } from "../input/TouchControls";

/**
 * FlightOnboarding — first-flight hint that explains how to translate the
 * Observer and how to leave a focused body. Shown once, then dismissed
 * forever (localStorage). The user can also close it manually.
 *
 * Discreet: appears 1.2s after exploration begins, auto-hides after 14s,
 * lives at the bottom-center above the FlightHUD. Never blocks the scene
 * (pointer-events-none on the wrapper, only on the dismiss button).
 */

const STORAGE_KEY = "ayat:flight:onboarded";
const AUTO_HIDE_MS = 14000;
const REVEAL_DELAY_MS = 1200;

interface Props {
  visible: boolean;
}

export function FlightOnboarding({ visible }: Props) {
  const isTouch = useIsTouchDevice();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* storage disabled — always show once per session */
    }
    setMounted(true);
    const revealId = window.setTimeout(() => setShow(true), REVEAL_DELAY_MS);
    const hideId = window.setTimeout(
      () => setShow(false),
      REVEAL_DELAY_MS + AUTO_HIDE_MS,
    );
    const removeId = window.setTimeout(
      () => setMounted(false),
      REVEAL_DELAY_MS + AUTO_HIDE_MS + 800,
    );
    return () => {
      window.clearTimeout(revealId);
      window.clearTimeout(hideId);
      window.clearTimeout(removeId);
    };
  }, [visible]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
    window.setTimeout(() => setMounted(false), 500);
  };

  if (!visible || !mounted) return null;

  const move = isTouch
    ? "Left thumbstick to glide"
    : "W A S D to glide · E / Space up · Q down";
  const modifiers = isTouch
    ? "Hold Boost or Brake to change pace"
    : "Hold Shift to boost · X to brake";
  const focus = isTouch
    ? "Tap a body to focus · glide again to release it"
    : "Double-click a body to focus · move to release it";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center transition-opacity duration-700 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 70px)" }}
      aria-live="polite"
    >
      <div className="pointer-events-auto max-w-[min(92vw,520px)] rounded-2xl border border-white/10 bg-black/55 px-5 py-3 text-center text-[0.7rem] font-light tracking-[0.16em] text-white/85 backdrop-blur-md">
        <div className="mb-1 text-[0.55rem] uppercase tracking-[0.32em] text-white/45">
          First flight
        </div>
        <div className="space-y-0.5 leading-relaxed">
          <div>{move}</div>
          <div className="text-white/65">{modifiers}</div>
          <div className="text-white/65">{focus}</div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 rounded-full border border-white/15 px-3 py-0.5 text-[0.5rem] uppercase tracking-[0.3em] text-white/60 transition-colors hover:border-white/40 hover:text-white/90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
