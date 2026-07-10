## Phase 22.6 — Real Scale & Cosmic Distance

The current opening drops the user into a "god-view" of the Solar System. The reference image asks for the opposite: **the Observer starts on Earth's surface, looking toward the horizon.** The naked eye sees only faint stars and the Milky Way band — no planets, no galaxies, no nebulae. Immensity is felt because almost nothing is visible.

The Solar System, deep-sky and travel systems already exist; we don't rewrite them. We add a new opening layer and reroute the entry sequence.

### What changes

**1. New `SurfaceScene` (opening layer)**
- New file `src/world/scene/SurfaceScene.tsx`. Renders:
  - A gently curved horizon (large low-poly sphere or ground plane with atmospheric fog) placed under the camera at ~1.7 m.
  - A subtle atmospheric gradient (night-side by default; day/night can come later — start with night).
  - Reuses the existing procedural `Starfield` at very low brightness/size.
  - A faint diffuse Milky Way band (single elongated additive sprite using existing soft-glow texture) tilted across the sky.
- No planets, no Sun, no deep-sky objects rendered in this scene.

**2. Two-stage scene routing**
- Add a lightweight scene enum in `src/world/state/` (`"surface" | "cosmos"`) with a subscribe hook.
- `WorldScene` picks `SurfaceScene` when stage is `"surface"`, `Universe` when `"cosmos"`.
- Default stage after awakening = `"surface"`. Switching to `"cosmos"` happens when the user "leaves Earth" (zoom-out past a threshold, or an explicit "Leave Earth" affordance in the existing HUD — reuses `ExplorerPanel`, no new UI system).

**3. Camera & controls on the surface**
- On surface stage, `CameraDirector` runs in a constrained "look" mode: free 360° yaw, pitch clamped ±85°, no translation. Existing FlightController is disabled while stage === "surface". Zoom-out beyond a threshold triggers the transition to `"cosmos"`.
- No new camera system — we set a flag the existing systems already read (`observation` vs `flight`) and clamp translation input at the FlightController level via the stage.

**4. Cosmos stage: preserve hierarchy from Phase 23**
- No further changes to `bodies.ts`, `stellar.ts`, or deep-sky catalogs. The distance layering shipped in Phase 23 stays as-is.
- When entering `"cosmos"`, camera is placed just outside Earth's position (small offset along the up-vector) so the transition reads as "leaving the atmosphere".

**5. Visual purity guardrails**
- Surface stage renders only: ground, atmosphere fog, starfield, Milky Way band. Nothing else.
- No debug quads, no placeholder sprites. If a texture fails to load, render nothing (existing pattern).

### Files touched

- **new** `src/world/scene/SurfaceScene.tsx`
- **new** `src/world/state/stage.ts` (tiny store: `getStage`, `setStage`, `useStage`)
- **edit** `src/world/WorldScene.tsx` — pick `SurfaceScene` vs `Universe` by stage
- **edit** `src/engine/CameraSystem.tsx` — gate translation on `stage === "cosmos"`; when `"surface"`, keep look-only + detect zoom-out transition
- **edit** `src/components/AyatApp.tsx` — after awakening, set stage to `"surface"`; add small "Leave Earth" control in existing HUD area
- **edit** `src/observer/awakening/state.ts` (only if needed) — reset stage to `"surface"` on replay

### Success criteria

- Opening frame: black sky, faint star points, a diffuse Milky Way band, Earth's horizon curving at the bottom. No planets, no galaxies visible.
- Zooming out (or pressing "Leave Earth") smoothly transitions to the existing Solar-System/Cosmos view already tuned in Phase 23.
- No regressions in Solar System, deep-sky, flight, or awakening. Typecheck clean.

Shall I build it?
