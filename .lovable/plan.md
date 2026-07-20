## Principe

Aucune lumière du ciel n'est un sprite anonyme. Chaque point visible = un objet astronomique doté d'une **identité stable** (id, type, coordonnées réelles, magnitude, distance). Le rendu ne choisit que le **niveau de détail** adapté à la distance ; l'identité ne change jamais.

## Architecture cible

```text
CelestialCatalog (source de vérité, jamais rendu directement)
├── Niveau 1 — Ciel visible depuis la Terre (~9 000 étoiles réelles, mag ≤ 6.5)
│     source: HYG catalog subset (RA/Dec/parallax/mag/spectre)
├── Niveau 2 — Étoiles proches (~300, distance < 25 pc)
│     visitables : possèdent un vrai Star + éventuel système procédural
├── Niveau 3 — Galaxies (catalogue existant, deep-sky)
│     extragalactiques, quasi-immobiles pendant le vol
├── Niveau 4 — Objets ciel profond (nébuleuses, amas, SNR, quasars)
│     destinations scientifiques, non décoratives
└── Niveau 5 — Fond procédural stable (étoiles trop lointaines)
      seed déterministe → même point toujours à la même position/couleur/type
      inatteignable mais possède un id + type
```

## LOD unique par objet

À chaque frame, pour chaque étoile du catalogue on résout un seul niveau :

```text
point lumineux (impostor 1 px, additif)
  ↓  distance décroît
étoile identifiable (sprite avec halo, couleur spectrale)
  ↓
véritable soleil (mesh EmissiveStarMaterial + corona)
  ↓
système stellaire (planètes procédurales si le seed le permet)
  ↓
surface (déjà géré par Planet/Moon)
```

Un même id passe continûment d'un niveau à l'autre — pas de pop, pas de duplication.

## Changements concrets

### Données
- `src/data/stars/hyg-bright.json` — extrait HYG (~9k étoiles, mag ≤ 6.5), généré via script `scripts/build-hyg.ts` (téléchargement + filtrage + projection RA/Dec→XYZ scène).
- `src/data/stars/catalog.ts` — élargi : chaque entrée porte `{ id, hip?, name?, ra, dec, distancePc, mag, spectralType, hasSystem: boolean }`.
- `src/sim/procedural/BackgroundStars.ts` — nouveau : générateur déterministe (seed = cellule spatiale) qui produit les étoiles de fond inatteignables mais avec identité stable.

### Rendu
- **Remplacer** `src/world/Starfield.tsx` par `src/world/sky/RealStarfield.tsx` :
  - Un seul `THREE.Points` alimenté par le catalogue HYG (positions/couleurs dérivées du type spectral, taille dérivée de la magnitude).
  - Additive léger, sans "warm dust" ni fake milky-way band (la MW émerge de la densité réelle des étoiles + du composant existant `MilkyWayGalaxy`).
- `src/world/sky/BackgroundStars.tsx` — points procéduraux (niveau 5), alimentés par `BackgroundStars` avec streaming par cellule.
- `src/world/sky/StarLOD.tsx` — pour chaque étoile "proche" (distance scène < seuil), monte dynamiquement le composant `<Star>` existant ; sinon reste dans le buffer `Points`.
- Suppression des passes "dust" et "milky-way warm band" décoratives dans Starfield.

### Streaming
- `src/streaming/StarStreamer.ts` — écoute la position caméra, promeut/démote les étoiles entre "point buffer" et "mesh Star" via `LODSystem` déjà existant.
- Cellules déterministes → pas d'apparition brutale, tout objet promu était déjà à sa position exacte dans le buffer.

### Identité persistante
- `src/world/state/identity.ts` — nouveau registre `SkyIdentityRegistry` : `raycast` sur le ciel retourne toujours un `{id, type}` même pour un pixel du fond procédural. Base pour Knowledge/Discovery futures.

## Ce qui NE change PAS
- `Star.tsx`, `Planet.tsx`, `Moon.tsx`, `EmissiveStarMaterial`, `SolarCorona`, `FocusRegistry`, `CameraDirector`, `FlightController`, `RealSky` (ciel diurne/lunaire depuis la Terre) — tous réutilisés tels quels.
- Deep-sky catalog et renderers (galaxies/nébuleuses) — conservés, ils deviennent simplement le Niveau 3/4 de la hiérarchie.

## Livraison (une seule étape, non fractionnée)
1. Script + import HYG → `hyg-bright.json`.
2. `RealStarfield` remplace `Starfield` dans `WorldScene`.
3. `BackgroundStars` + `StarStreamer` branchés.
4. Vérification visuelle : Playwright screenshot depuis la Terre (constellations reconnaissables), puis à mi-vol vers Proxima (grossissement continu), puis vue galactique (Andromède stable).

## Risques
- Poids du JSON HYG (~500 KB gzip pour 9k étoiles) — acceptable, chargé une fois.
- Coût GPU : un seul `Points` de 9k + ~500 procéduraux streamés → équivalent ou moins que le Starfield actuel (3 passes × milliers).
