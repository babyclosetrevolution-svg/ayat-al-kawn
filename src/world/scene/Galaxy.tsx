import type { ReactNode } from "react";

/**
 * Galaxy — hierarchy placeholder. In later phases this layer will own
 * background galactic structure (arms, dust, star catalog clouds) and host
 * one or more SolarSystem children.
 */
export function Galaxy({ children }: { children: ReactNode }) {
  return <group>{children}</group>;
}
