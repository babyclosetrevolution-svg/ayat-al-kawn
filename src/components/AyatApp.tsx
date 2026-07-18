import { useEffect, useRef, useState } from "react";
import { Engine } from "../engine/Engine";
import { WorldScene } from "../world/WorldScene";
import { TitleScreen } from "../ui/TitleScreen";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { ArrivalOverlay } from "../ui/ArrivalOverlay";
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
 *
 * Onboarding refondu selon la règle nord : *« Ne pas montrer l'Univers,
 * mais faire ressentir son immensité. »*
 *
 *   1. Seuil        — TitleScreen minimal, un clic ouvre.
 *   2. Arrivée      — Fondu depuis le noir absolu (~5 s), on émerge.
 *   3. Silence      — ~12 s sans aucun HUD, aucun bouton, aucun panneau.
 *                     La contemplation d'abord ; les outils, jamais avant.
 *   4. Chuchotement — Une seule ligne discrète invite à s'élever.
 *   5. Outils       — Aucun panneau visible par défaut. `Tab` invoque
 *                     le chrome complet ; tout se referme au repos.
 *
 * La sortie de Terre se fait par le geste (molette / défilement) et non
 * par un bouton — la scène `SurfaceScene` gère cela directement.
 */
export function AyatApp() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [awakening, setAwakening] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [contemplating, setContemplating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const isTouch = useIsTouchDevice();
  const stage = useStage();
  const hintTimerRef = useRef<number | null>(null);

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

  // Phase silence → chuchotement. Toute interaction sur la Terre
  // écourte le silence et retarde le chuchotement (le joueur explore
  // déjà, ne pas commenter).
  const enterSurface = () => {
    setArriving(true);
    setContemplating(true);
    setShowHint(false);
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    // Fin du fondu d'arrivée
    window.setTimeout(() => setArriving(false), 5200);
    // Sortie du silence (~12 s après l'arrivée)
    window.setTimeout(() => setContemplating(false), 12000);
    // Chuchotement d'invitation à s'élever (~18 s après l'arrivée)
    hintTimerRef.current = window.setTimeout(() => setShowHint(true), 18000);
  };

  useEffect(() => {
    if (!exploring) return;
    // Toute interaction significative repousse le chuchotement — le
    // joueur a déjà commencé à regarder.
    const bumpHint = () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
      setShowHint(false);
      hintTimerRef.current = window.setTimeout(() => setShowHint(true), 22000);
    };
    window.addEventListener("pointerdown", bumpHint);
    window.addEventListener("wheel", bumpHint, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", bumpHint);
      window.removeEventListener("wheel", bumpHint);
    };
  }, [exploring]);

  // Le joueur qui bouge écourte le silence : dès qu'il regarde autour,
  // on considère l'immersion acquise et on autorise les outils (mais
  // sans les afficher — ils restent à la demande).
  useEffect(() => {
    if (!contemplating) return;
    const wake = () => setContemplating(false);
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("wheel", wake, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("wheel", wake);
    };
  }, [contemplating]);

  // Une fois hors silence, `Tab` bascule le chrome (HUD + panneaux).
  useEffect(() => {
    if (!exploring || contemplating) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setChromeVisible((v) => !v);
      } else if (e.key === "Escape") {
        setChromeVisible(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exploring, contemplating]);

  const handleBegin = () => {
    StageState.set("surface");
    setExploring(true);
    enterSurface();
  };
  const handleAwakeningDone = () => {
    setAwakening(false);
    StageState.set("surface");
    setExploring(true);
    enterSurface();
  };
  const handleReplayAwakening = () => {
    AwakeningState.replay();
    setExploring(false);
    StageState.set("surface");
    setAwakening(true);
  };

  // Le chrome (HUD, panneaux, replay) n'apparaît jamais pendant le
  // silence, et n'est visible ensuite que si le joueur l'invoque
  // explicitement via `Tab`.
  const chromeOn = exploring && !contemplating && chromeVisible;

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

      {/* Chrome complet — masqué par défaut, invoqué au Tab */}
      <ObserverHUD visible={chromeOn} />
      <FlightHUD visible={chromeOn} />
      {/* L'onboarding vol apparaît dès l'entrée en exploration, une seule
          fois par utilisateur — c'est LE hint essentiel, il ne doit pas
          rester caché derrière la touche Tab. */}
      <FlightOnboarding visible={exploring && !contemplating} />

      <TitleBar visible={chromeOn} />
      <ExplorerPanel visible={chromeOn} />
      <KnowledgePanel visible={chromeOn} />

      <TitleScreen visible={!loading && !exploring && !awakening} onBegin={handleBegin} />
      <LoadingOverlay visible={loading} progress={progress} />
      <ArrivalOverlay active={arriving} />

      <MetricsOverlay />
      <ComparisonOverlay />
      <ObservatoryRoot />

      {exploring && (
        <>
          {chromeOn && (
            <>
              <ModeSwitcher />
              <JourneyPicker />
              <AssistantPanel />
              <ContemplationLauncher />
              <AudioSettingsPanel />
              <button
                type="button"
                onClick={handleReplayAwakening}
                className="pointer-events-auto fixed top-3 right-3 z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/50 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white/80"
              >
                Replay awakening
              </button>
            </>
          )}
          {/* Ces couches restent toujours montées : le JourneyPlayer et
              l'overlay de contemplation sont des expériences déclenchées,
              pas du chrome. Elles ne s'affichent que si un voyage ou une
              contemplation est active. */}
          <JourneyPlayer />
          <ContemplationOverlay />

          {/* Chuchotement d'invitation à s'élever — apparaît tard, très
              discrètement, s'efface au moindre geste. */}
          {stage === "surface" && !contemplating && showHint && (
            <div className="pointer-events-none fixed inset-x-0 bottom-[8%] z-20 flex justify-center animate-fade-in">
              <p className="text-[0.6rem] uppercase tracking-[0.5em] text-white/35">
                Avancez pour vous élever
              </p>
            </div>
          )}


          {/* Rappel Tab — apparaît une fois, très bas, très pâle,
              seulement après la sortie du silence. */}
          {!contemplating && !chromeVisible && showHint && (
            <div className="pointer-events-none fixed bottom-2 right-3 z-20 text-[0.5rem] uppercase tracking-[0.4em] text-white/20">
              Tab — outils
            </div>
          )}

          {/* Retour Terre depuis le cosmos — bouton minimal, un seul,
              en bas à gauche, jamais dominant. */}
          {stage === "cosmos" && (
            <button
              type="button"
              onClick={() => StageState.set("surface")}
              className="pointer-events-auto fixed bottom-6 left-6 z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.55rem] uppercase tracking-[0.3em] text-white/50 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white/80"
            >
              Retour sur Terre
            </button>
          )}
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
