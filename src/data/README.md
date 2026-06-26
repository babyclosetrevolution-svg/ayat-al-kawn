# Astronomical Datasets

Future phases will populate this folder with structured scientific data.

Planned subfolders:

- `solar-system/` — planets, moons, orbital elements, physical parameters.
- `stars/` — nearby star catalog (HYG, Gaia subsets).
- `galaxies/` — Local Group and beyond.
- `constellations/` — IAU constellation boundaries and star lines.
- `deep-sky/` — Messier, NGC catalogs.

Each dataset must be a pure JSON/TSV/CSV resource consumed by the rendering layer
through the `AssetManager`. Rendering code must never embed scientific values directly.
