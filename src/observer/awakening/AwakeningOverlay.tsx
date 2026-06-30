import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlightController, bindInputs, MotionSettingsStore } from "../flight";
import { AWAKENING_STAGES, type StageContext } from "./stages";
import { AwakeningScene, useBeacons } from "./AwakeningScene";
import { HintBanner } from "./HintBanner";
import { AwakeningState } from "./state";
import { Observer } from "../core/Observer";
import { Presence } from "../presence/PresenceState";

/**
 * AwakeningOverlay — orchestrates the entire introduction.
 *
 *  - Fades to black, then gently fades in deep space.
 *  - Mounts an independent R3F scene with a real FlightController.
 *  - Advances through AWAKENING_STAGES based on live input + metrics.
 *  - Reveals a distant Sun and the closing invitation, then yields to
 *    the main Universe via `onComplete`.
 *
 * No scientific module is touched; the main Engine is hidden while the
 * Awakening plays so we don't fight OrbitControls.
 */

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = "fade-in" | "playing" | "reveal" | "closing";

export function AwakeningOverlay({ onComplete, onSkip }: Props) {
  const beacons = useBeacons();
  const controller = useMemo(() => new FlightController(), []);
  const bindings = useMemo(() => bindInputs(), []);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("fade-in");
  const [stageIdx, setStageIdx] = useState(0);
  const [activeBeacon, setActiveBeacon] = useState(-1);
  const [sunReveal, setSunReveal] = useState(0);
  const stageStartedAt = useRef(performance.now());
  const stageRotated = useRef(0);
  const lastMetrics = useRef({
    speed: 0,
    nearestBeaconDistance: Number.POSITIVE_INFINITY,
    rotationDelta: 0,
  });

  // Initial cinematic fade-in: black → starfield.
  useEffect(() => {
    const id = setTimeout(() => setPhase("playing"), 1400);
    return () => clearTimeout(id);
  }, []);

  // Stage advancement loop — independent of R3F so it keeps ticking even
  // when the user is perfectly still.
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const tick = () => {
      const stage = AWAKENING_STAGES[stageIdx];
      if (!stage) {
        setPhase("reveal");
        return;
      }
      const now = performance.now();
      const elapsedMs = now - stageStartedAt.current;
      stageRotated.current += lastMetrics.current.rotationDelta;
      lastMetrics.current.rotationDelta = 0;
      const ctx: StageContext = {
        input: bindings.state,
        speed: lastMetrics.current.speed,
        nearestBeaconDistance: lastMetrics.current.nearestBeaconDistance,
        nearestBeaconIndex: activeBeacon,
        elapsed: elapsedMs / 1000,
        rotated: stageRotated.current,
      };
      if (elapsedMs >= stage.minDwellMs && stage.done(ctx)) {
        setStageIdx((i) => i + 1);
        stageStartedAt.current = performance.now();
        stageRotated.current = 0;
        // Unveil the next beacon at the "focus" stage.
        if (stage.id === "free") setActiveBeacon(0);
        else if (stage.id === "focus") setActiveBeacon(1);
        else if (stage.id === "approach") setActiveBeacon(-1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, stageIdx, activeBeacon, bindings.state]);

  // Reveal phase — fade in the distant Sun, then the closing invitation.
  useEffect(() => {
    if (phase !== "reveal") return;
    Observer.setMode("observe");
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / 3800);
      setSunReveal(t);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setPhase("closing"), 2200);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Closing — invite the user, mark seen, then hand off.
  useEffect(() => {
    if (phase !== "closing") return;
    const id = setTimeout(() => {
      AwakeningState.markSeen();
      bindings.releasePointerLock();
      Presence.set("idle");
      onComplete();
    }, 3600);
    return () => clearTimeout(id);
  }, [phase, onComplete, bindings]);

  // Cleanup on unmount — release pointer lock + key listeners.
  useEffect(() => {
    return () => {
      bindings.dispose();
    };
  }, [bindings]);

  // Capture user gesture once to enable pointer lock for the look stage.
  const enableLook = useCallback(() => {
    bindings.setPointerLockTarget(overlayRef.current);
    bindings.requestPointerLock();
  }, [bindings]);

  // Auto-request pointer lock on first click anywhere in the overlay.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const onClick = () => enableLook();
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [enableLook]);

  const handleSkip = useCallback(() => {
    AwakeningState.markSeen();
    bindings.releasePointerLock();
    onSkip();
  }, [bindings, onSkip]);

  const stage = AWAKENING_STAGES[stageIdx];
  const showCanvas = phase !== "fade-in";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] cursor-none select-none bg-black"
    >
      {showCanvas && (
        <div
          className="absolute inset-0 transition-opacity duration-[2200ms]"
          style={{ opacity: phase === "fade-in" ? 0 : 1 }}
        >
          <AwakeningScene
            sunReveal={sunReveal}
            activeBeacon={activeBeacon}
            beacons={beacons}
            bindings={bindings}
            controller={controller}
            onMetrics={(m) => {
              lastMetrics.current.speed = m.speed;
              lastMetrics.current.nearestBeaconDistance = m.nearestBeaconDistance;
              lastMetrics.current.rotationDelta += m.rotationDelta;
            }}
          />
        </div>
      )}

      {/* Soft vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Fade-in black mask */}
      <div
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-[2200ms]"
        style={{ opacity: phase === "fade-in" ? 1 : 0 }}
      />

      {/* Hint banner */}
      {phase === "playing" && stage && <HintBanner text={stage.hint} />}

      {/* Closing invitation */}
      {phase === "closing" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="animate-fade-in text-center text-[clamp(1.8rem,4vw,3.4rem)] font-extralight tracking-[0.45em] text-white/95">
            Observe.&nbsp;&nbsp;Explore.&nbsp;&nbsp;Comprends.
          </p>
        </div>
      )}

      {/* Skip — always discreet, always available */}
      <button
        type="button"
        onClick={handleSkip}
        className="pointer-events-auto absolute right-6 top-6 cursor-pointer rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.35em] text-white/60 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white/90"
      >
        Skip introduction
      </button>
    </div>
  );
}
