/**
 * Seed encyclopedia content.
 *
 * The encyclopedia is fully content-driven: this file does not author
 * articles inline. Instead, every entry is registered as a lazy loader
 * pointing at a content module under `./content/`. Adding a new entry
 * is one line here plus one content file — no other code changes.
 *
 * Content modules export an `EncyclopediaContent` default. They use
 * `LocalizedText` for every user-facing string so future translations
 * can be added incrementally without touching the runtime.
 */
import { EncyclopediaRegistry } from "./registry/EncyclopediaRegistry";

EncyclopediaRegistry.register("earth", () =>
  import("./content/earth").then((m) => m.default),
);
EncyclopediaRegistry.register("moon", () =>
  import("./content/moon").then((m) => m.default),
);
EncyclopediaRegistry.register("mars", () =>
  import("./content/mars").then((m) => m.default),
);
