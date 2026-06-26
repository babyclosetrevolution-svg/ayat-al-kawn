import { Starfield } from "./Starfield";
import { Sun } from "./objects/Sun";
import { Earth } from "./objects/Earth";
import { Moon } from "./objects/Moon";

/**
 * WorldScene — Phase 2: Sun, Earth, Moon system.
 * Future phases will compose additional astronomical objects alongside these.
 */
export function WorldScene() {
  return (
    <>
      <Starfield />
      <Sun />
      <Earth />
      <Moon />
    </>
  );
}
