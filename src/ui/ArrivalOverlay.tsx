import { useEffect, useState } from "react";

interface ArrivalOverlayProps {
  active: boolean;
  duration?: number;
}

/**
 * ArrivalOverlay — le passage du seuil.
 *
 * Un fondu depuis le noir absolu. Pendant ~5 secondes, on n'est nulle
 * part : on émerge. Le ciel ne s'allume pas, il *apparaît*. Aucun
 * texte, aucun bouton — la seule chose qui se passe, c'est que le noir
 * se retire.
 */
export function ArrivalOverlay({ active, duration = 5000 }: ArrivalOverlayProps) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      return;
    }
    setOpacity(1);
    // Deux phases : plateau court de noir absolu, puis fondu long.
    const hold = 500;
    const t = setTimeout(() => setOpacity(0), hold);
    return () => clearTimeout(t);
  }, [active, duration]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[45] bg-black"
      style={{
        opacity,
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    />
  );
}
