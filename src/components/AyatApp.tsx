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
import { CameraAttachment, ObserverHUD } from "../observer";
import { AwakeningOverlay, AwakeningState } from "../observer/awakening";
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
  const [exploring, setExploring] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black text-white">
      <Engine>
        <WorldScene />
        <CameraAttachment />
      </Engine>
      <AudioBridge />
      <ObserverHUD visible={exploring} />
      <TitleBar visible={exploring} />
      <ExplorerPanel visible={exploring} />
      <KnowledgePanel visible={exploring} />
      <TitleScreen visible={!loading && !exploring} onBegin={() => setExploring(true)} />
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
        </>
      )}
      <Toaster />

    </div>
  );
}

