import type {
  ObserverListener,
  ObserverMode,
  ObserverState,
  Quat,
  Vec3,
} from "../types";
import type { FocusKey } from "../../world/state/focus";

/**
 * Observer — central living entity. Owns position, orientation, velocity,
 * acceleration, movement state, focus state and awareness state.
 *
 * The CameraAttachment writes the camera-derived pose into the Observer
 * each frame; the HUD and other consumers subscribe through this singleton.
 *
 * Scientific modules MUST NOT be modified — the Observer is purely additive.
 */

const v0 = (): Vec3 => ({ x: 0, y: 0, z: 0 });
const q0 = (): Quat => ({ x: 0, y: 0, z: 0, w: 1 });

class ObserverImpl {
  private state: ObserverState = {
    position: v0(),
    orientation: q0(),
    velocity: v0(),
    acceleration: v0(),
    speed: 0,
    mode: "idle",
    awareness: {
      focus: null,
      watching: [],
      lastInteractionAt: 0,
    },
  };

  private listeners = new Set<ObserverListener>();
  private dirty = false;

  get(): ObserverState {
    return this.state;
  }

  subscribe(cb: ObserverListener): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Internal — flushed at most once per frame from MovementController. */
  private emit() {
    if (!this.dirty) return;
    this.dirty = false;
    for (const l of this.listeners) l(this.state);
  }

  setMode(mode: ObserverMode) {
    if (this.state.mode === mode) return;
    this.state = { ...this.state, mode };
    this.dirty = true;
    this.emit();
  }

  setFocus(focus: FocusKey) {
    if (this.state.awareness.focus === focus) return;
    this.state = {
      ...this.state,
      awareness: { ...this.state.awareness, focus },
    };
    this.dirty = true;
    this.emit();
  }

  markInteraction() {
    this.state.awareness.lastInteractionAt = performance.now();
  }

  /**
   * Replace kinematics in-place — called by the CameraAttachment each frame.
   * We mutate the existing vectors to avoid GC pressure, then flag dirty so
   * subscribers get exactly one snapshot per frame via flush().
   */
  updateKinematics(p: Vec3, o: Quat, v: Vec3, a: Vec3, speed: number) {
    const s = this.state;
    s.position.x = p.x; s.position.y = p.y; s.position.z = p.z;
    s.orientation.x = o.x; s.orientation.y = o.y; s.orientation.z = o.z; s.orientation.w = o.w;
    s.velocity.x = v.x; s.velocity.y = v.y; s.velocity.z = v.z;
    s.acceleration.x = a.x; s.acceleration.y = a.y; s.acceleration.z = a.z;
    s.speed = speed;
    this.dirty = true;
  }

  /** Flushed once per frame after all integrations. */
  flush() {
    this.emit();
  }
}

export const Observer = new ObserverImpl();
