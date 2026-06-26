/**
 * LightingSystem — physically-inspired default lighting for empty space.
 * Phase 1 keeps it minimal: a faint ambient term so a future object isn't pitch black,
 * and one directional "starlight" key. Real star light sources (e.g. the Sun)
 * will be added by their owning world objects in later phases.
 */
export function LightingSystem() {
  return (
    <>
      <ambientLight intensity={0.02} color={0x8899bb} />
      <directionalLight
        position={[10, 5, 10]}
        intensity={0.15}
        color={0xffffff}
      />
    </>
  );
}
