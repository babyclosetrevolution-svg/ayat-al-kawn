import type { ReactNode } from "react";

/**
 * Sector — hierarchy placeholder between Galaxy and Region. Future
 * partitioning of the galactic disk will mount Sectors as siblings.
 */
export function Sector({ children }: { children: ReactNode }) {
  return <group>{children}</group>;
}
