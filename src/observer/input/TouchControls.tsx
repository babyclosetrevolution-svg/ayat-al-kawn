import { useEffect, useMemo, useRef, useState } from "react";
import { attachTouchSource, type TouchSourceHandle } from "./sources/TouchSource";

/**
 * TouchControls — mobile / tablet HUD.
 *
 * Layout
 *   Left thumb  : virtual joystick (movement)
 *   Right thumb : drag surface (look)
 *   Bottom      : Boost + Brake pill buttons
 *
 * Controls fade after 3s of inactivity and reappear on any touch. Respects
 * safe-area insets for notches / home indicators.
 */

const JOY_RADIUS = 56;
const JOY_INNER = 26;

export function TouchControls({ onSkip }: { onSkip?: () => void }) {
  const [visible, setVisible] = useState(true);
  const lastActivityRef = useRef(performance.now());
  const sourceRef = useRef<TouchSourceHandle | null>(null);

  // Joystick state
  const joyRef = useRef<HTMLDivElement>(null);
  const [joy, setJoy] = useState({ dx: 0, dy: 0, active: false });
  const joyPointerId = useRef<number | null>(null);
  const joyOrigin = useRef({ x: 0, y: 0 });

  // Look pad state
  const lookRef = useRef<HTMLDivElement>(null);
  const lookPointerId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  const [boost, setBoost] = useState(false);
  const [brake, setBrake] = useState(false);

  useEffect(() => {
    const s = attachTouchSource();
    sourceRef.current = s;
    return () => s.dispose();
  }, []);

  // Auto-hide when idle
  useEffect(() => {
    const id = window.setInterval(() => {
      const idle = performance.now() - lastActivityRef.current > 3200;
      setVisible(!idle || joy.active || boost || brake);
    }, 400);
    return () => window.clearInterval(id);
  }, [joy.active, boost, brake]);

  const bumpActivity = () => {
    lastActivityRef.current = performance.now();
    if (!visible) setVisible(true);
  };

  // ---- Joystick handlers -----------------------------------------------
  const onJoyDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
    if (joyPointerId.current !== null) return;
    joyPointerId.current = ev.pointerId;
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    const rect = joyRef.current!.getBoundingClientRect();
    joyOrigin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setJoy({ dx: 0, dy: 0, active: true });
    bumpActivity();
  };
  const onJoyMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== joyPointerId.current) return;
    const dx = ev.clientX - joyOrigin.current.x;
    const dy = ev.clientY - joyOrigin.current.y;
    const len = Math.hypot(dx, dy);
    const max = JOY_RADIUS;
    const nx = len > max ? (dx / len) * max : dx;
    const ny = len > max ? (dy / len) * max : dy;
    setJoy({ dx: nx, dy: ny, active: true });
    sourceRef.current?.setMove(nx / max, ny / max);
    bumpActivity();
  };
  const onJoyUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== joyPointerId.current) return;
    joyPointerId.current = null;
    setJoy({ dx: 0, dy: 0, active: false });
    sourceRef.current?.setMove(0, 0);
  };

  // ---- Look pad handlers -----------------------------------------------
  const onLookDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
    if (lookPointerId.current !== null) return;
    lookPointerId.current = ev.pointerId;
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    lookLast.current = { x: ev.clientX, y: ev.clientY };
    bumpActivity();
  };
  const onLookMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== lookPointerId.current) return;
    const dx = ev.clientX - lookLast.current.x;
    const dy = ev.clientY - lookLast.current.y;
    lookLast.current = { x: ev.clientX, y: ev.clientY };
    sourceRef.current?.addLook(dx, dy);
    bumpActivity();
  };
  const onLookUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== lookPointerId.current) return;
    lookPointerId.current = null;
  };

  // ---- Boost / Brake ---------------------------------------------------
  const holdHandlers = (setter: (on: boolean) => void, action: "boost" | "brake") => ({
    onPointerDown: (ev: React.PointerEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      (ev.target as Element).setPointerCapture?.(ev.pointerId);
      setter(true);
      if (action === "boost") sourceRef.current?.setBoost(true);
      else sourceRef.current?.setBrake(true);
      bumpActivity();
    },
    onPointerUp: () => {
      setter(false);
      if (action === "boost") sourceRef.current?.setBoost(false);
      else sourceRef.current?.setBrake(false);
    },
    onPointerCancel: () => {
      setter(false);
      if (action === "boost") sourceRef.current?.setBoost(false);
      else sourceRef.current?.setBrake(false);
    },
  });

  const opacity = visible ? 1 : 0.25;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[65] select-none touch-none transition-opacity duration-500"
      style={{ opacity }}
    >
      {/* Left joystick */}
      <div
        ref={joyRef}
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
        className="pointer-events-auto absolute rounded-full border border-white/25 bg-white/[0.06] backdrop-blur-md"
        style={{
          left: `max(env(safe-area-inset-left, 0px), 20px)`,
          bottom: `max(env(safe-area-inset-bottom, 0px), 24px)`,
          width: JOY_RADIUS * 2,
          height: JOY_RADIUS * 2,
          touchAction: "none",
        }}
      >
        <div
          className="absolute rounded-full border border-white/40 bg-white/70 shadow-lg"
          style={{
            width: JOY_INNER * 2,
            height: JOY_INNER * 2,
            left: JOY_RADIUS - JOY_INNER + joy.dx,
            top: JOY_RADIUS - JOY_INNER + joy.dy,
            transition: joy.active ? "none" : "left 180ms ease, top 180ms ease",
          }}
        />
      </div>

      {/* Right look pad */}
      <div
        ref={lookRef}
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookUp}
        onPointerCancel={onLookUp}
        className="pointer-events-auto absolute"
        style={{
          right: 0,
          top: 0,
          bottom: 0,
          width: "45%",
          touchAction: "none",
        }}
      />

      {/* Boost / Brake */}
      <div
        className="pointer-events-auto absolute flex flex-col gap-3"
        style={{
          right: `max(env(safe-area-inset-right, 0px), 20px)`,
          bottom: `max(env(safe-area-inset-bottom, 0px), 24px)`,
        }}
      >
        <button
          type="button"
          {...holdHandlers(setBoost, "boost")}
          className={`h-14 w-14 rounded-full border text-[0.55rem] uppercase tracking-[0.28em] backdrop-blur-md transition-colors ${
            boost
              ? "border-amber-200 bg-amber-200/25 text-amber-100"
              : "border-white/25 bg-white/[0.06] text-white/75"
          }`}
        >
          Boost
        </button>
        <button
          type="button"
          {...holdHandlers(setBrake, "brake")}
          className={`h-14 w-14 rounded-full border text-[0.55rem] uppercase tracking-[0.28em] backdrop-blur-md transition-colors ${
            brake
              ? "border-sky-200 bg-sky-200/25 text-sky-100"
              : "border-white/25 bg-white/[0.06] text-white/75"
          }`}
        >
          Brake
        </button>
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="pointer-events-auto absolute rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/70 backdrop-blur-md"
          style={{
            top: `max(env(safe-area-inset-top, 0px), 14px)`,
            right: `max(env(safe-area-inset-right, 0px), 14px)`,
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}

export function useIsTouchDevice(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      window.matchMedia?.("(pointer: coarse)").matches
    );
  }, []);
}
