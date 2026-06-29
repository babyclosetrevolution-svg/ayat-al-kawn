import { useEffect } from "react";
import { AudioEngine } from "../engine/AudioEngine";
import { AmbienceRegistry } from "../registry/ambienceRegistry";
import { FocusRegistry } from "../../world/state/focus";
import { CatalogManager } from "../../sim";

/**
 * AudioBridge — listens to focus changes and swaps the active ambient
 * layer set with a natural crossfade. Pure side-effect component; no DOM.
 */
export function AudioBridge() {
  useEffect(() => {
    const unlockOnce = () => {
      void AudioEngine.unlock().then(() => applyForCurrentFocus());
      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
    };
    window.addEventListener("pointerdown", unlockOnce, { once: true });
    window.addEventListener("keydown", unlockOnce, { once: true });

    const applyForCurrentFocus = () => {
      const id = FocusRegistry.getActive();
      if (!id) {
        AudioEngine.setActiveLayers([]);
        return;
      }
      const category = resolveCategory(id);
      AudioEngine.setActiveLayers(AmbienceRegistry.resolve(id, category));
    };

    const off = FocusRegistry.subscribe(() => applyForCurrentFocus());
    applyForCurrentFocus();
    return () => {
      off();
      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
    };
  }, []);
  return null;
}

function resolveCategory(id: string): string | undefined {
  const solar = CatalogManager.get("solar-system") ?? [];
  const found = solar.find((b) => b.id === id);
  if (found) return found.type;
  const stars = CatalogManager.get("stars") ?? [];
  if (stars.find((b) => b.id === id)) return "star";
  const galaxies = CatalogManager.get("galaxies") ?? [];
  if (galaxies.find((g) => g.id === id)) return "galaxy";
  const deep = CatalogManager.get("deep-sky") ?? [];
  const ds = deep.find((b) => b.id === id);
  if (ds) {
    type DS = { deepSky?: { kind?: string } };
    const k = (ds as unknown as DS).deepSky?.kind ?? "";
    if (k.includes("galaxy")) return "galaxy";
    if (k.includes("nebula") || k.includes("supernova")) return "nebula";
    if (k.includes("cluster")) return "cluster";
  }
  return undefined;
}
