/**
 * Shared glass-surface and motion class fragments.
 *
 * Keeping these as plain strings (rather than CSS) means every floating UI
 * element shares the exact same rounded corners, translucency, border,
 * blur and shadow — the interface reads as a single product instead of
 * a stack of independently styled widgets.
 */

export const GLASS_SURFACE =
  "rounded-2xl border border-white/12 bg-black/40 shadow-[0_18px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl";

export const GLASS_BUTTON =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/75 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 ease-out hover:border-white/30 hover:text-white hover:bg-black/55 hover:shadow-[0_18px_45px_-18px_rgba(80,160,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

export const EYEBROW =
  "text-[0.55rem] uppercase tracking-[0.4em] text-white/45";
