import type { ReactNode } from "react";

/**
 * Region — hierarchy placeholder between Sector and a LocalSystem
 * (e.g. a Solar System or stellar neighborhood). Streaming decisions
 * happen at this level.
 */
export function Region({ children }: { children: ReactNode }) {
  return <group>{children}</group>;
}
