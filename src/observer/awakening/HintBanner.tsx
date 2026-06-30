import { useEffect, useState } from "react";

/**
 * HintBanner — minimal contextual hint shown low on the screen. Cross-
 * fades whenever the text changes so transitions feel intentional.
 */
export function HintBanner({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (text === shown) {
      setOpacity(1);
      return;
    }
    setOpacity(0);
    const id = setTimeout(() => {
      setShown(text);
      setOpacity(1);
    }, 420);
    return () => clearTimeout(id);
  }, [text, shown]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex justify-center">
      <div
        className="rounded-full border border-white/10 bg-black/45 px-7 py-2.5 text-center text-[0.72rem] font-light tracking-[0.32em] text-white/85 uppercase backdrop-blur-md transition-opacity duration-[420ms]"
        style={{ opacity }}
      >
        {shown}
      </div>
    </div>
  );
}
