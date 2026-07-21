# PHASE 23 — UNIVERSE SCALE ENGINE (verrou architectural)

## Principe

Une **seule autorité** décide de la visibilité de toute la scène :
`UniverseScaleEngine`. Aucun composant n'est autorisé à tester une
distance, un altitude ou un `stage` pour décider s'il s'affiche.
Ajouter un contenu = l'envelopper dans `<ScaleGroup layer="…">`.

## Hiérarchie des niveaux

| Niveau | Nom                  | Actif quand…                          | Couches visibles                     |
|--------|----------------------|---------------------------------------|--------------------------------------|
| 0      | Surface terrestre    | altitude Terre-mère < ~1.5 R          | surface, milkyWay(dim), realStars    |
| 1      | Terre / Lune         | altitude 3–12 R                       | surface(fin), milkyWay, realStars    |
| 2      | Système solaire      | distSoleil < 6 000                    | solarBodies, orbits, milkyWay, realStars |
| 3      | Voisinage stellaire  | distSoleil 6 000–22 000               | stellarNeighborhood, milkyWay, realStars |
| 4      | Voie Lactée          | distSoleil 22 000–70 000              | milkyWay, deepSky(émerge), realStars |
| 5      | Univers profond      | distSoleil > 70 000                   | deepSky, milkyWay, realStars         |

`realStars` (buffer HYG) est **toujours** visible : c'est le référentiel.

## Fichiers du moteur

- `src/sim/scale/UniverseScaleEngine.ts` — singleton, courbes d'opacité
  par morceaux (smoothstep), calcul `L∈[0,5]` continu.
- `src/sim/scale/ScaleLayer.tsx` — wrapper `<ScaleGroup layer="…">` :
  applique l'opacité aux matériaux transparents et coupe `.visible`
  sous 2 %.
- `src/sim/scale/ScaleUpdater.tsx` — pousse la caméra dans l'engine 1×/frame.
- `src/sim/scale/__tests__/UniverseScaleEngine.test.ts` — invariants :
  hiérarchie correcte, monotonie, bande de transition, unimodalité.

## Règles absolues

1. Aucun `if (altitude < …)` ou `if (stage === …)` dans les renderers.
2. Toute nouvelle couche = un `<ScaleGroup>` + une entrée dans `CURVES`.
3. Les courbes d'opacité sont **unimodales** (une apparition, une extinction).
4. Les bandes de transition font ≥ 0.6 niveau — jamais de pop.

## Nettoyage effectué

- Supprimé `src/world/scene/CosmicLayer.tsx` (ancien gate ad-hoc).
- Supprimé `src/world/Starfield.tsx` (starfield procédural, remplacé par HYG).
- `OrbitLine` multiplie désormais son opacité par
  `UniverseScaleEngine.getLayerOpacity("orbits")` : plus jamais visible
  hors Niveau 2.
- `SurfaceScene` est désormais gouverné par la couche `surface` — plus
  aucune décision de visibilité par altitude au niveau du composant.

## À plugger plus tard (hors scope Phase 23)

- Un mesh Terre-comme-planète à `homeEarth.position` visible aux Niveaux
  1-2 (aujourd'hui la sphère est peinte en noir mat, c'est le sol vu de
  près). L'architecture est prête : ajouter la couche `earthBody` +
  courbe `[[0,0],[1,1],[3,1],[3.8,0]]`.
