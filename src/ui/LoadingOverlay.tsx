interface LoadingOverlayProps {
  visible: boolean;
  progress?: number;
  label?: string;
}

/**
 * LoadingOverlay — full-screen overlay prepared for future asset streaming.
 * Phase 1: cosmetic, driven by a boolean. Later phases wire it to AssetManager progress.
 */
export function LoadingOverlay({
  visible,
  progress = 0,
  label = "Calibrating instruments…",
}: LoadingOverlayProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#03050a] transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="h-px w-40 overflow-hidden bg-white/10">
          <div
            className="h-full bg-white/70 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
        <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/50">
          {label}
        </p>
      </div>
    </div>
  );
}
