import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlightController, bindInputs } from "../flight";
import { AWAKENING_STAGES, STAGE_HELP, type StageContext } from "./stages";
import { AwakeningScene, useBeacons } from "./AwakeningScene";
import { HintBanner } from "./HintBanner";
import { AwakeningState } from "./state";
import { Observer } from "../core/Observer";
import { Presence } from "../presence/PresenceState";
import { InputManager, TouchControls, useIsTouchDevice } from "../input";

/**
 * AwakeningOverlay — orchestrates the entire introduction.
 *
 *  - Fades to black, then gently fades in deep space.
 *  - Mounts an independent R3F scene with a real FlightController.
 *  - Advances through AWAKENING_STAGES based on live input + metrics.
 *  - Reveals a distant Sun and the closing invitation, then yields to
 *    the main Universe via `onComplete`.
 *
 * QA hardening
 *  - No hidden layers intercept clicks (canvas keeps a pointer, touch pad
 *    is scoped, joystick pointer-captures).
 *  - Never requires pointer lock. Mouse drag rotates the view when the
 *    browser refuses lock, and touch devices get virtual controls.
 *  - Recovery help appears after prolonged inactivity so no stage can
 *    strand the user; a stage also auto-advances after a hard timeout.
 */

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = "fade-in" | "playing" | "reveal" | "closing";

const HELP_DELAY_MS = 8000;
const HARD_TIMEOUT_MS = 45000;

export function AwakeningOverlay({ onComplete, onSkip }: Props) {
  const beacons = useBeacons();
  const controller = useMemo(() => new FlightController(), []);
  const bindings = useMemo(() => bindInputs(), []);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouchDevice();

  const [phase, setPhase] = useState<Phase>("fade-in");
  const [stageIdx, setStageIdx] = useState(0);
  const [activeBeacon, setActiveBeacon] = useState(-1);
  const [sunReveal, setSunReveal] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const stageStartedAt = useRef(performance.now());
  const stageRotated = useRef(0);
  const lastMetrics = useRef({
    speed: 0,
    nearestBeaconDistance: Number.POSITIVE_INFINITY,
    rotationDelta: 0,
  });

  // Initial cinematic fade-in.
  useEffect(() => {
    const id = setTimeout(() => setPhase("playing"), 1400);
    return () => clearTimeout(id);
  }, []);

  // Attempt to focus the window so keyboard events reach us immediately
  // (some browsers park focus on the address bar after navigation).
  useEffect(() => {
    if (phase !== "playing") return;
    try {
      window.focus();
      overlayRef.current?.focus?.();
    } catch {
      /* ignore */
    }
  }, [phase]);

  // Bind the pointer-lock target once mounted. Lock is only requested when
  // the user explicitly clicks the canvas — never automatically — so a
  // browser that refuses lock still leaves the experience fully playable
  // via drag-to-look.
  useEffect(() => {
    bindings.setPointerLockTarget(overlayRef.current);
  }, [bindings]);

  // Stage advancement + recovery loop.
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

      // Recovery: contextual help after N seconds without input in-stage.
      const idleMs = InputManager.msSinceLastInput();
      const shouldHelp =
        elapsedMs > HELP_DELAY_MS &&
        idleMs > HELP_DELAY_MS &&
        !stage.done(ctx);
      if (shouldHelp !== showHelp) setShowHelp(shouldHelp);

      const advance = () => {
        setStageIdx((i) => i + 1);
        stageStartedAt.current = performance.now();
        stageRotated.current = 0;
        setShowHelp(false);
        if (stage.id === "free") setActiveBeacon(0);
        else if (stage.id === "focus") setActiveBeacon(1);
        else if (stage.id === "approach") setActiveBeacon(-1);
      };

      if (elapsedMs >= stage.minDwellMs && stage.done(ctx)) {
        advance();
      } else if (elapsedMs > HARD_TIMEOUT_MS) {
        // Never let a user get permanently stuck.
        advance();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, stageIdx, activeBeacon, bindings.state, showHelp]);

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

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      bindings.dispose();
      InputManager.reset();
    };
  }, [bindings]);

  const handleSkip = useCallback(() => {
    AwakeningState.markSeen();
    bindings.releasePointerLock();
    onSkip();
  }, [bindings, onSkip]);

  // Optional pointer-lock upgrade — only on user gesture, only on desktop.
  const upgradeToPointerLock = useCallback(() => {
    if (isTouch) return;
    bindings.requestPointerLock();
  }, [bindings, isTouch]);

  const stage = AWAKENING_STAGES[stageIdx];
  const showCanvas = phase !== "fade-in";
  const help = stage && STAGE_HELP[stage.id];
  const helpText = help ? (isTouch ? help.touch : help.desktop) : "";

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      onMouseDown={upgradeToPointerLock}
      className="fixed inset-0 z-[60] select-none bg-black outline-none"
    >
      {showCanvas && (
        <div className="absolute inset-0 opacity-100 transition-opacity duration-[2200ms]">
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

      {/* Touch controls — mobile / tablet */}
      {phase === "playing" && isTouch && <TouchControls onSkip={handleSkip} />}

      {/* Hint banner */}
      {phase === "playing" && stage && <HintBanner text={stage.hint} />}

      {/* Recovery help — non-intrusive, device-specific */}
      {phase === "playing" && showHelp && helpText && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[22%] flex justify-center">
          <div className="animate-fade-in rounded-2xl border border-white/10 bg-black/55 px-5 py-2 text-center text-[0.7rem] font-light tracking-[0.18em] text-white/70 backdrop-blur-md">
            {helpText}
          </div>
        </div>
      )}

      {/* Closing invitation */}
      {phase === "closing" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="animate-fade-in text-center text-[clamp(1.8rem,4vw,3.4rem)] font-extralight tracking-[0.45em] text-white/95">
            Observe.&nbsp;&nbsp;Explore.&nbsp;&nbsp;Comprends.
          </p>
        </div>
      )}

      {/* Skip — always discreet, always available on desktop; the touch
          HUD has its own Skip so we avoid duplicating on small screens. */}
      {!isTouch && (
        <button
          type="button"
          onClick={handleSkip}
          className="pointer-events-auto absolute right-6 top-6 cursor-pointer rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.35em] text-white/60 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white/90"
        >
          Skip introduction
        </button>
      )}
    </div>
  );
}
