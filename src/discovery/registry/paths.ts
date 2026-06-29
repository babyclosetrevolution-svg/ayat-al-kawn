import type { LearningPath } from "../types";

/**
 * Guided learning paths — ordered sequences across the catalogue.
 * Each step is an EntityId; bodies focus the camera, topics inform.
 */
export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "path:rocky-planets",
    title: "The Rocky Planets",
    summary: "Tour the four terrestrial worlds of the inner Solar System.",
    steps: ["mercury", "venus", "earth", "mars", "topic:habitable-zone"],
  },
  {
    id: "path:gas-giants",
    title: "The Gas Giants",
    summary: "From Jupiter's storms to Neptune's winds.",
    steps: ["jupiter", "saturn", "uranus", "neptune", "topic:ring-systems"],
  },
  {
    id: "path:moons-of-jupiter",
    title: "Moons of Jupiter",
    summary: "Explore the four Galilean satellites.",
    steps: ["jupiter", "io", "europa", "ganymede", "callisto", "topic:subsurface-ocean"],
  },
  {
    id: "path:nearby-stars",
    title: "Stars Near the Sun",
    summary: "Step out of the Solar System into the local stellar neighborhood.",
    steps: ["sun", "proxima-centauri", "alpha-centauri-a", "alpha-centauri-b", "sirius"],
  },
  {
    id: "path:scale",
    title: "The Scale of the Solar System",
    summary: "From the Sun outward to Neptune — and beyond.",
    steps: ["sun", "earth", "jupiter", "neptune", "topic:scale"],
  },
];
