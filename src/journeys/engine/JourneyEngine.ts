import type { Journey, JourneyChapter, JourneyRuntimeState } from "../types";
import { FocusRegistry } from "../../world/state/focus";
import { ComparisonState } from "../../scale/engine/state";

/**
 * JourneyEngine — drives a guided tour without duplicating camera logic.
 *
 * The engine only mutates focus + overlays. The existing CameraDirector
 * does the actual cinematic transition, and the ComparisonOverlay handles
 * any educational comparison the chapter requests.
 *
 * Time is driven by `tick(deltaSeconds)`, called from a hook. We avoid
 * an internal interval so React's reduced-motion preference and the
 * window's visibility state remain authoritative.
 */
class JourneyEngineImpl {
  private state: JourneyRuntimeState = {
    active: null,
    chapterIndex: 0,
    status: "idle",
    elapsed: 0,
  };
  private listeners = new Set<(s: JourneyRuntimeState) => void>();

  get(): JourneyRuntimeState {
    return this.state;
  }

  subscribe(cb: (s: JourneyRuntimeState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    for (const l of this.listeners) l(this.state);
  }

  private applyChapter(chapter: JourneyChapter): void {
    FocusRegistry.setActive(chapter.focus);
    const overlay = chapter.overlay ?? { kind: "none" };
    if (overlay.kind === "comparison") {
      ComparisonState.openWith(overlay.ids, overlay.comparisonKind);
    } else {
      // Close any leftover comparison from a previous chapter.
      const cs = ComparisonState.get();
      if (cs.open) ComparisonState.close();
    }
  }

  start(journey: Journey): void {
    if (journey.chapters.length === 0) return;
    this.state = { active: journey, chapterIndex: 0, status: "playing", elapsed: 0 };
    this.applyChapter(journey.chapters[0]);
    this.emit();
  }

  pause(): void {
    if (this.state.status !== "playing") return;
    this.state = { ...this.state, status: "paused" };
    this.emit();
  }

  resume(): void {
    if (!this.state.active || this.state.status !== "paused") return;
    this.state = { ...this.state, status: "playing" };
    this.emit();
  }

  next(): void {
    const j = this.state.active;
    if (!j) return;
    const idx = Math.min(j.chapters.length - 1, this.state.chapterIndex + 1);
    if (idx === this.state.chapterIndex) {
      this.stop();
      return;
    }
    this.state = { ...this.state, chapterIndex: idx, elapsed: 0 };
    this.applyChapter(j.chapters[idx]);
    this.emit();
  }

  previous(): void {
    const j = this.state.active;
    if (!j) return;
    const idx = Math.max(0, this.state.chapterIndex - 1);
    if (idx === this.state.chapterIndex) return;
    this.state = { ...this.state, chapterIndex: idx, elapsed: 0 };
    this.applyChapter(j.chapters[idx]);
    this.emit();
  }

  stop(): void {
    const cs = ComparisonState.get();
    if (cs.open) ComparisonState.close();
    this.state = { active: null, chapterIndex: 0, status: "idle", elapsed: 0 };
    this.emit();
  }

  tick(delta: number): void {
    if (this.state.status !== "playing" || !this.state.active) return;
    const chapter = this.state.active.chapters[this.state.chapterIndex];
    const dwell = chapter.dwellSeconds ?? 10;
    const elapsed = this.state.elapsed + delta;
    if (elapsed >= dwell) {
      const last = this.state.chapterIndex >= this.state.active.chapters.length - 1;
      if (last) {
        this.stop();
        return;
      }
      this.next();
    } else {
      this.state = { ...this.state, elapsed };
      this.emit();
    }
  }
}

export const JourneyEngine = new JourneyEngineImpl();
