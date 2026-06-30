import type { FlightTier, VelocityProfile } from "./types";

/**
 * VelocityProfiles — four adaptive tiers describing how fast the Observer
 * glides at different scales. The FlightController interpolates smoothly
 * between tiers so the user never feels an abrupt speed change.
 */

export const PROFILES: Record<FlightTier, VelocityProfile> = {
  "very-slow": { tier: "very-slow", base: 0.6, boost: 2.4, accelRate: 3.0, damping: 0.85 },
  medium: { tier: "medium", base: 8, boost: 28, accelRate: 2.6, damping: 0.88 },
  fast: { tier: "fast", base: 80, boost: 320, accelRate: 2.2, damping: 0.9 },
  "very-fast": { tier: "very-fast", base: 1200, boost: 5200, accelRate: 1.8, damping: 0.92 },
};

/** Returns the profile that best matches the given distance-to-focus. */
export function pickTier(distanceToFocus: number | null): FlightTier {
  if (distanceToFocus == null) return "medium";
  if (distanceToFocus < 30) return "very-slow";
  if (distanceToFocus < 600) return "medium";
  if (distanceToFocus < 12000) return "fast";
  return "very-fast";
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
    accelRate: a.accelRate + (b.accelRate - a.accelRate) * u,
    damping: a.damping + (b.damping - a.damping) * u,
  };
}
