import type { FlightTier, VelocityProfile } from "./types";

/**
 * VelocityProfiles — four adaptive tiers describing how fast the Observer
 * glides at different scales. The FlightController interpolates smoothly
 * between tiers so the user never feels an abrupt speed change.
 */

export const PROFILES: Record<FlightTier, VelocityProfile> = {
  // Long glide = high damping (closer to 1) applied per-frame when input
  // is released. `boost` is the sustained Shift speed; `hyperBoost` is the
  // fully-charged extra-fast ceiling reached after ~1.4s of held Shift.
  // Sangoku feel: soft ramp, silent coast, colossal reachable speed.
  "very-slow": { tier: "very-slow", base: 0.6, boost: 3.5, hyperBoost: 12, accelRate: 1.6, damping: 0.985 },
  medium:      { tier: "medium",    base: 10,  boost: 55,  hyperBoost: 240, accelRate: 1.4, damping: 0.988 },
  fast:        { tier: "fast",      base: 90,  boost: 650, hyperBoost: 3200, accelRate: 1.2, damping: 0.99 },
  "very-fast": { tier: "very-fast", base: 1400, boost: 9000, hyperBoost: 60000, accelRate: 1.0, damping: 0.992 },
};

/** Tier thresholds (distance to focus/pivot, world units). */
const TIER_STOPS: Array<{ tier: FlightTier; max: number }> = [
  { tier: "very-slow", max: 30 },
  { tier: "medium", max: 600 },
  { tier: "fast", max: 12000 },
  { tier: "very-fast", max: Infinity },
];

/** Returns the profile that best matches the given distance-to-focus. */
export function pickTier(distanceToFocus: number | null): FlightTier {
  if (distanceToFocus == null) return "medium";
  for (const stop of TIER_STOPS) if (distanceToFocus < stop.max) return stop.tier;
  return "very-fast";
}

/**
 * Continuous, smoothly interpolated profile keyed by distance. Eliminates
 * the discrete speed jump when crossing a tier threshold — the Observer
 * accelerates naturally as it moves through scales.
 */
export function profileAtDistance(distance: number | null): VelocityProfile {
  if (distance == null || !isFinite(distance)) return PROFILES.medium;
  const d = Math.max(0.01, distance);
  // Map distance to a fractional index across PROFILES using log space so
  // the blend feels perceptually uniform across many orders of magnitude.
  const anchors: Array<{ d: number; p: VelocityProfile }> = [
    { d: 6, p: PROFILES["very-slow"] },
    { d: 120, p: PROFILES.medium },
    { d: 3000, p: PROFILES.fast },
    { d: 60000, p: PROFILES["very-fast"] },
  ];
  if (d <= anchors[0].d) return anchors[0].p;
  if (d >= anchors[anchors.length - 1].d) return anchors[anchors.length - 1].p;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (d >= a.d && d <= b.d) {
      const t = (Math.log(d) - Math.log(a.d)) / (Math.log(b.d) - Math.log(a.d));
      const s = t * t * (3 - 2 * t); // smoothstep
      return blendProfiles(a.p, b.p, s);
    }
  }
  return PROFILES.medium;
}

/** Linearly blend two profiles by `t` in [0,1]. */
export function blendProfiles(
  a: VelocityProfile,
  b: VelocityProfile,
  t: number,
): VelocityProfile {
  const u = Math.max(0, Math.min(1, t));
  return {
    tier: b.tier,
    base: a.base + (b.base - a.base) * u,
    boost: a.boost + (b.boost - a.boost) * u,
    hyperBoost: a.hyperBoost + (b.hyperBoost - a.hyperBoost) * u,
    accelRate: a.accelRate + (b.accelRate - a.accelRate) * u,
    damping: a.damping + (b.damping - a.damping) * u,
  };
}
