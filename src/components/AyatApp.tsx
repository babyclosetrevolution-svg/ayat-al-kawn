import { useEffect, useState } from "react";
import { Engine } from "../engine/Engine";
import { WorldScene } from "../world/WorldScene";
import { TitleScreen } from "../ui/TitleScreen";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { ExplorerPanel } from "../ui/ExplorerPanel";
import { TitleBar } from "../ui/TitleBar";
import { KnowledgePanel } from "../knowledge";
import { MetricsOverlay } from "../metrics";
import { Toaster } from "../components/ui/sonner";
import { ComparisonOverlay } from "../scale";
import { ObservatoryRoot, ModeSwitcher } from "../observatory";
import { AudioBridge, AudioSettingsPanel } from "../audio";
import { JourneyPicker, JourneyPlayer } from "../journeys";
import { AssistantPanel } from "../assistant";
import { ContemplationLauncher, ContemplationOverlay } from "../contemplation";
import { CameraAttachment, ObserverHUD, PresenceLayer, MotionField, FlightHUD, FlightOnboarding } from "../observer";
import { TouchControls, useIsTouchDevice } from "../observer/input/TouchControls";
import { AwakeningOverlay, AwakeningState } from "../observer/awakening";
import { StageState, useStage } from "../world/state/stage";
import "../discovery";
import "../exploration";
import "../encyclopedia/seed";


/**
 * AyatApp — client-only composition root.
 * Orchestrates loading → title → exploration states. Each layer remains
 * independent; this file only wires them together.
 */
export function AyatApp() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [awakening, setAwakening] = useState(false);
  const [exploring, setExploring] = useState(false);
  const isTouch = useIsTouchDevice();
  const stage = useStage();

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1600);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setLoading(false), 300);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleBegin = () => {
    // Land straight on Earth: observer standing on the ground, looking
    // up at a starry sky. The Awakening remains available on demand via
    // the replay button — the default opening is contemplation, not a
    // scripted intro.
    StageState.set("surface");
    setExploring(true);
  };
  const handleAwakeningDone = () => {
    setAwakening(false);
    StageState.set("surface");
    setExploring(true);
  };
  const handleReplayAwakening = () => {
    AwakeningState.replay();
    setExploring(false);
    StageState.set("surface");
    setAwakening(true);
  };

  return (
    <div className="fixed inset-0 bg-black text-white">
      {!awakening && (
        <Engine>
          <WorldScene />
          <CameraAttachment />
          <MotionField />
          <PresenceLayer />
        </Engine>
      )}
      <AudioBridge />
      <ObserverHUD visible={exploring} />
      <FlightHUD visible={exploring} />
      <FlightOnboarding visible={exploring} />
      <TitleBar visible={exploring} />
      <ExplorerPanel visible={exploring} />
      <KnowledgePanel visible={exploring} />
      <TitleScreen visible={!loading && !exploring && !awakening} onBegin={handleBegin} />
      <LoadingOverlay visible={loading} progress={progress} />
      <MetricsOverlay />
      <ComparisonOverlay />
      <ObservatoryRoot />
      {exploring && (
        <>
          <ModeSwitcher />
          <JourneyPicker />
          <JourneyPlayer />
          <AssistantPanel />
          <ContemplationLauncher />
          <ContemplationOverlay />
          <AudioSettingsPanel />
          <button
            type="button"
            onClick={handleReplayAwakening}
            className="pointer-events-auto fixed top-3 right-3 z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/50 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white/80"
          >
            Replay awakening
          </button>
          {stage === "surface" && (
            <>
              <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex flex-col items-center gap-1 text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/70">
                  L'observateur est petit
                </p>
                <p className="text-[0.55rem] uppercase tracking-[0.35em] text-white/40">
                  L'univers est immense
                </p>
              </div>
              <button
                type="button"
                onClick={() => StageState.set("cosmos")}
                className="pointer-events-auto fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-black/50 px-5 py-2 text-[0.6rem] uppercase tracking-[0.35em] text-white/70 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
              >
                Quitter la Terre
              </button>
            </>
          )}
          {stage === "cosmos" && (
            <button
              type="button"
              onClick={() => StageState.set("surface")}
              className="pointer-events-auto fixed bottom-6 left-6 z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/50 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white/80"
            >
              Retour sur Terre
            </button>
          )}
          {isTouch && stage === "cosmos" && <TouchControls />}
        </>
      )}
      {awakening && (
        <AwakeningOverlay
          onComplete={handleAwakeningDone}
          onSkip={handleAwakeningDone}
        />
      )}
      <Toaster />
    </div>
  );
}


