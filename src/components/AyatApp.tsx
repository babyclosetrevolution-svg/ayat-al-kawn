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
    StageState.set("surface");
    if (AwakeningState.hasSeen()) setExploring(true);
    else setAwakening(true);
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
          {isTouch && <TouchControls />}
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


