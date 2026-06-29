import type { Experience } from "../types";

/**
 * Experience catalogue — declarative, body-scoped descriptors.
 *
 * Every entry binds controls to parameter keys consumed by the world
 * layer. Adding a new experience is a pure data change: the UI rebuilds
 * itself from this list.
 */
const EARTH: Experience[] = [
  {
    id: "rotation",
    bodyId: "earth",
    title: "Day & Night",
    description:
      "Earth rotates once every 24 hours, sweeping the terminator — the boundary between day and night — across its surface.",
    playable: true,
    controls: [
      {
        kind: "slider",
        paramKey: "earth.rotationSpeed",
        label: "Rotation speed",
        defaultValue: 1,
        min: 0,
        max: 50,
        step: 0.5,
        unit: "×",
        ticks: [
          { value: 0, label: "Pause" },
          { value: 1, label: "Real" },
          { value: 25, label: "Fast" },
        ],
        note: "Real time is barely perceptible; accelerate to watch sunrise sweep around the globe.",
      },
    ],
  },
  {
    id: "atmosphere",
    bodyId: "earth",
    title: "Atmosphere",
    description:
      "The atmosphere scatters sunlight, producing the blue rim and softening the transition between day and night.",
    controls: [
      {
        kind: "slider",
        paramKey: "earth.atmosphereIntensity",
        label: "Atmosphere intensity",
        defaultValue: 1,
        min: 0,
        max: 2.5,
        step: 0.05,
        unit: "×",
        note: "Higher intensity simulates a denser, more diffuse sky.",
      },
      {
        kind: "toggle",
        paramKey: "earth.cloudsVisible",
        label: "Cloud cover",
        defaultValue: true,
        note: "Toggle the cloud deck to compare bare and atmospheric appearance.",
      },
    ],
  },
];

const MOON: Experience[] = [
  {
    id: "orbit",
    bodyId: "moon",
    title: "Orbit Speed",
    description:
      "The Moon completes one orbit around Earth every 27.3 days. Speeding it up reveals how its tidally-locked face always points home.",
    playable: true,
    controls: [
      {
        kind: "slider",
        paramKey: "moon.orbitSpeed",
        label: "Orbit speed",
        defaultValue: 1,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "×",
        ticks: [
          { value: 0, label: "Pause" },
          { value: 1, label: "Real" },
          { value: 15, label: "Fast" },
        ],
      },
    ],
  },
];

const MARS: Experience[] = [
  {
    id: "atmosphere",
    bodyId: "mars",
    title: "Atmosphere Density",
    description:
      "Mars has an atmosphere ~1% the density of Earth's. Vary it to see how a denser sky would tint the planet's limb.",
    controls: [
      {
        kind: "slider",
        paramKey: "mars.atmosphereIntensity",
        label: "Atmosphere intensity",
        defaultValue: 1,
        min: 0,
        max: 2.5,
        step: 0.05,
        unit: "×",
      },
    ],
  },
  {
    id: "rotation",
    bodyId: "mars",
    title: "Rotation",
    description:
      "A Martian day (sol) lasts 24h 37m — almost identical to Earth's.",
    playable: true,
    controls: [
      {
        kind: "slider",
        paramKey: "mars.rotationSpeed",
        label: "Rotation speed",
        defaultValue: 1,
        min: 0,
        max: 50,
        step: 0.5,
        unit: "×",
        ticks: [
          { value: 0, label: "Pause" },
          { value: 1, label: "Real" },
        ],
      },
    ],
  },
];

const JUPITER: Experience[] = [
  {
    id: "rotation",
    bodyId: "jupiter",
    title: "Rotation Speed",
    description:
      "Jupiter is the fastest-spinning planet — a day lasts under 10 hours, driving its banded cloud structure.",
    playable: true,
    controls: [
      {
        kind: "slider",
        paramKey: "jupiter.rotationSpeed",
        label: "Rotation speed",
        defaultValue: 1,
        min: 0,
        max: 50,
        step: 0.5,
        unit: "×",
        ticks: [
          { value: 0, label: "Pause" },
          { value: 1, label: "Real" },
          { value: 25, label: "Fast" },
        ],
      },
    ],
  },
];

const SATURN: Experience[] = [
  {
    id: "rings",
    bodyId: "saturn",
    title: "Rings",
    description:
      "Saturn's rings are tilted 26.7° to its orbital plane. As Saturn orbits the Sun, our viewing angle changes from edge-on to wide open.",
    controls: [
      {
        kind: "toggle",
        paramKey: "saturn.ringsVisible",
        label: "Show rings",
        defaultValue: true,
      },
      {
        kind: "slider",
        paramKey: "saturn.ringTiltOffset",
        label: "Ring plane angle",
        defaultValue: 0,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
        ticks: [
          { value: -45, label: "Edge" },
          { value: 0, label: "Real" },
          { value: 45, label: "Open" },
        ],
        note: "Offset added to the rings' real tilt to compare viewing geometries.",
      },
    ],
  },
  {
    id: "rotation",
    bodyId: "saturn",
    title: "Rotation Speed",
    description:
      "Saturn rotates in about 10.7 hours. Its rapid spin flattens it visibly at the poles.",
    playable: true,
    controls: [
      {
        kind: "slider",
        paramKey: "saturn.rotationSpeed",
        label: "Rotation speed",
        defaultValue: 1,
        min: 0,
        max: 50,
        step: 0.5,
        unit: "×",
      },
    ],
  },
];

const SUN: Experience[] = [
  {
    id: "activity",
    bodyId: "sun",
    title: "Solar Activity",
    description:
      "The Sun's activity follows an 11-year cycle. At maximum, sunspots multiply and the corona expands.",
    controls: [
      {
        kind: "slider",
        paramKey: "sun.activity",
        label: "Activity level",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "×",
        ticks: [
          { value: 0, label: "Quiet" },
          { value: 1, label: "Now" },
          { value: 2, label: "Max" },
        ],
        note: "Modulates the corona brightness as a visual proxy for solar maxima and minima.",
      },
      {
        kind: "toggle",
        paramKey: "sun.coronaVisible",
        label: "Show corona",
        defaultValue: true,
      },
    ],
  },
];

const ALL: Experience[] = [
  ...EARTH,
  ...MOON,
  ...MARS,
  ...JUPITER,
  ...SATURN,
  ...SUN,
];

class ExperienceRegistryImpl {
  private byBody = new Map<string, Experience[]>();

  constructor(seed: Experience[]) {
    for (const e of seed) this.register(e);
  }

  register(exp: Experience): void {
    const bucket = this.byBody.get(exp.bodyId);
    if (bucket) bucket.push(exp);
    else this.byBody.set(exp.bodyId, [exp]);
  }

  forBody(id: string | null | undefined): Experience[] {
    if (!id) return [];
    return this.byBody.get(id) ?? [];
  }

  hasAny(id: string | null | undefined): boolean {
    return this.forBody(id).length > 0;
  }
}

export const ExperienceRegistry = new ExperienceRegistryImpl(ALL);
