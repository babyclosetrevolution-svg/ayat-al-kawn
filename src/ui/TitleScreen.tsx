import { useEffect, useState } from "react";
import { BRAND } from "../core/config";

interface TitleScreenProps {
  visible: boolean;
  onBegin: () => void;
}

/**
 * TitleScreen — le seuil.
 *
 * Pas de bouton, pas d'appel à l'action déguisé en verbe de jeu.
 * L'écran est presque vide : une seule phrase, chuchotée, une étoile
 * qui respire. Un clic — n'importe où, ou une touche — ouvre le ciel.
 * Le titre AYAT AL-KAWN n'apparaît qu'en filigrane, brièvement, puis
 * s'efface pour ne pas commenter l'immensité à venir.
 */
export function TitleScreen({ visible, onBegin }: TitleScreenProps) {
  const [prompt, setPrompt] = useState(false);
  const [brand, setBrand] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPrompt(false);
    setBrand(false);
    const t1 = setTimeout(() => setBrand(true), 900);
    const t2 = setTimeout(() => setPrompt(true), 3400);
    const t3 = setTimeout(() => setBrand(false), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const trigger = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.key === "Tab" || e.key === "Escape")) return;
      onBegin();
    };
    window.addEventListener("pointerdown", trigger, { once: true });
    window.addEventListener("keydown", trigger, { once: true });
    return () => {
      window.removeEventListener("pointerdown", trigger);
      window.removeEventListener("keydown", trigger);
    };
  }, [visible, onBegin]);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-[1600ms] ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Étoile qui respire — point d'ancrage silencieux */}
      <div className="relative flex items-center justify-center">
        <span
          className="block h-[3px] w-[3px] rounded-full bg-white/90"
          style={{
            boxShadow: "0 0 12px 2px rgba(255,255,255,0.55)",
            animation: "titleBreath 5.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Titre en filigrane, très bref */}
      <h1
        className={`mt-16 text-[clamp(1.6rem,4.5vw,3.2rem)] font-extralight tracking-[0.5em] text-white/60 transition-opacity duration-[2000ms] ${
          brand ? "opacity-100" : "opacity-0"
        }`}
      >
        {BRAND.title}
      </h1>

      {/* La seule instruction — chuchotée */}
      <p
        className={`absolute bottom-[18%] text-[0.68rem] uppercase tracking-[0.55em] text-white/55 transition-opacity duration-[2400ms] ${
          prompt ? "opacity-100" : "opacity-0"
        }`}
      >
        Levez les yeux
      </p>

      <style>{`
        @keyframes titleBreath {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}
