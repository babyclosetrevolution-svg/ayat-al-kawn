/**
 * TimeManager — global simulation clock.
 *
 * The renderer uses real frame time (delta from useFrame). The simulation
 * (rotations, orbits, future ephemerides) uses *simulation time* exposed
 * here. Sim time can be paused, played, and scaled independently.
 *
 *   real delta  ──► TimeManager.tick(realDelta)
 *                       │
 *                       ├─ paused? → simDelta = 0
 *                       └─ else   → simDelta = realDelta * speed
 *
 * All future astronomical systems (orbital mechanics, n-body propagation,
 * stellar evolution previews, mission timelines) MUST source their time
 * from this manager, never from raw frame deltas.
 */

export type SpeedPreset = 1 | 10 | 100 | 1000 | 100000;
export const SPEED_PRESETS: readonly SpeedPreset[] = [1, 10, 100, 1000, 100000];

interface Tick {
  /** Simulation seconds elapsed since the previous frame (0 when paused). */
  delta: number;
  /** Total simulation seconds since clock start. */
  elapsed: number;
  /** Current speed multiplier. */
  speed: number;
  /** Whether the clock is paused. */
  paused: boolean;
}

type Listener = (tick: Tick) => void;

class TimeManagerImpl {
  private _paused = false;
  private _speed = 1;
  private _elapsed = 0;
  private _delta = 0;
  private listeners = new Set<Listener>();

  /** Called once per real frame by SimulationClock — do not call from app code. */
  tick(realDelta: number): void {
    this._delta = this._paused ? 0 : realDelta * this._speed;
    this._elapsed += this._delta;
    if (this.listeners.size > 0) {
      const snap = this.snapshot();
      for (const l of this.listeners) l(snap);
    }
  }

  pause(): void {
    this._paused = true;
  }
  play(): void {
    this._paused = false;
  }
  toggle(): void {
    this._paused = !this._paused;
  }
  setSpeed(speed: number): void {
    this._speed = Math.max(0, speed);
  }

  get paused(): boolean {
    return this._paused;
  }
  get speed(): number {
    return this._speed;
  }
  /** Last simulation delta (seconds). */
  get delta(): number {
    return this._delta;
  }
  /** Cumulative simulation time (seconds). */
  get elapsed(): number {
    return this._elapsed;
  }

  snapshot(): Tick {
    return {
      delta: this._delta,
      elapsed: this._elapsed,
      speed: this._speed,
      paused: this._paused,
    };
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  reset(): void {
    this._elapsed = 0;
    this._delta = 0;
  }
}

export const TimeManager = new TimeManagerImpl();
export type { Tick };
