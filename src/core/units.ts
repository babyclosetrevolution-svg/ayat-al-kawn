/**
 * Units — astronomical units of length, time, and mass.
 *
 * All physical constants in the codebase MUST be expressed via these units
 * so the engine never carries unitless magic numbers. Scene-space scaling
 * (how many scene units represent 1 AU, 1 km, etc.) is centralised here
 * via `SCENE` so future scale transitions stay coherent.
 */

// ── Length (meters as base) ──────────────────────────────────────────────
export const METER = 1;
export const KILOMETER = 1_000;
export const AU = 149_597_870_700; // International Astronomical Union (2012)
export const LIGHT_YEAR = 9.460_730_472_580_8e15;
export const PARSEC = 3.085_677_581_491_3e16;

// ── Time (seconds as base) ───────────────────────────────────────────────
export const SECOND = 1;
export const MINUTE = 60;
export const HOUR = 3_600;
export const DAY = 86_400;
export const YEAR = 365.25 * DAY;

// ── Mass (kilograms as base) ─────────────────────────────────────────────
export const KILOGRAM = 1;
export const EARTH_MASS = 5.972_2e24;
export const SOLAR_MASS = 1.988_5e30;

/**
 * Scene scaling factors. These convert real-world quantities to the
 * artistic scene units the renderer uses. Phase 4 keeps the existing
 * Phase 3 visual scale; future scale transitions will adjust these.
 */
export const SCENE = {
  /** Scene units per AU at the solar-system scale. */
  unitsPerAU: 30,
  /** Scene units per kilometer for body radii at planetary scale. */
  unitsPerKilometer: 1 / 1_000,
} as const;

/** Helpers — convert SI to scene units. */
export const toScene = {
  fromAU: (au: number) => au * SCENE.unitsPerAU,
  fromKm: (km: number) => km * SCENE.unitsPerKilometer,
  fromMeters: (m: number) => (m / 1_000) * SCENE.unitsPerKilometer,
} as const;
