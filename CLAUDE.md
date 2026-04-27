# Millennium Falcon — test technique Animaj

Backend Docker qui calcule une des routes les plus rapides pour le Faucon Millenium. Critère d'évaluation explicite du README : **qualité de code "prod"**.

## Contrat d'API

- `POST /compute`, body `{ "arrival": "Endor" }` → `{ "duration": 8, "route": ["Tatooine","Hoth","Endor"] }`
- `duration` inclut les refuels. `route` **ne duplique pas** la planète lors d'un refuel.

## Config au démarrage — `millennium-falcon.json`

```json
{ "autonomy": 6, "departure": "Tatooine", "routes_db": "universe.db" }
```

`routes_db` : chemin absolu **ou** relatif au `millennium-falcon.json` lui-même (⚠️ pas au CWD).

## DB SQLite

Table `routes(origin TEXT, destination TEXT, travel_time UNSIGNED INTEGER)`. Routes **bi-directionnelles**.

## Règles métier

1. Départ avec `autonomy` jours de fuel.
2. Si `travel_time > fuel_restant` → refuel **obligatoire** : +1 jour sur place, `fuel = autonomy`.
3. Refuel = +1 jour dans `duration`, aucun nœud ajouté à `route`.
4. Refuel **préventif** autorisé (peut débloquer un meilleur chemin — l'algo doit le considérer).

## Décisions techniques

- **Stack** : Node.js + TypeScript + Fastify
- **Validation** : Zod
- **SQLite** : `better-sqlite3`, graphe chargé en RAM au démarrage
- **Tests** : vitest
- **Lint/format** : Biome
- **Logger** : pino (natif Fastify)
- **Config** : arg CLI + fallback env `CONFIG_PATH`
- **Docker** : multi-stage `node:22-alpine`, user non-root, healthcheck `/health`
- **Structure** : monorepo léger (backend/ ; éventuel frontend/ plus tard, pas de workspaces tant qu'il n'y en a qu'un).
  ```
  backend/
    src/
      app.ts              ← build Fastify (testable sans listen)
      server.ts           ← entrypoint
      config.ts           ← load + validate millennium-falcon.json
      routes/compute.ts   ← handler HTTP
      domain/             ← algo (Dijkstra étendu)
      repository/routes.ts← SQLite → Route[]
      schemas/            ← Zod
    tests/
    Dockerfile
  ```
- **Algo** : **Dijkstra itératif sur graphe étendu `(planète, fuel_restant)`** + **heap binaire** via `heap-js` (lib mature, focus sur l'algo plutôt que sur la structure de données).
  - Arcs : "saut" vers voisin si `fuel ≥ travel_time` (coût = travel_time, conso fuel) ; "refuel" sur place si `fuel < autonomy` (coût = 1, fuel → autonomy).
  - Optimisations en réserve si le gros dataset le demande : **pruning par dominance** sur `(p, f, c)`, puis **A\*** avec heuristique = plus court chemin sans contrainte fuel (pré-calculé via un Dijkstra simple, admissible).
  - Écartés : bidirectional (asymétrie de l'état fuel + critère d'arrêt fragile = mauvais ROI), récursif (cycles + risque stack overflow + moins idiomatique).
- **Cas limites de `/compute`** :
  - `arrival == departure` → `200 { duration: 0, route: [departure] }`.
  - Pas de chemin possible / planète inexistante → `404 { error: "no route to <arrival>" }`.
- [ ] CI GitHub Actions (bonus : lint + typecheck + tests + docker build)

## Scalabilité

Le dataset fourni est minuscule mais **le user testera avec des graphes beaucoup plus gros**. Implications :
- Dijkstra sur `(planète, fuel)` : complexité `O((V·A + E·A) · log(V·A))`. Le facteur `A` = autonomy peut être critique → prévoir pruning par dominance (`(p, f1)` domine `(p, f2)` si `f1 ≥ f2` à coût égal).
- Heap binaire nécessaire (pas de tri linéaire).
- Si la DB ne tient plus en RAM un jour : requêtes SQL à la demande (pas prioritaire).
- Prévoir un test de perf avec dataset généré plus gros.

## Points ouverts

- [ ] `departure` absente de la DB au démarrage → crash (fail-fast) ou warn ? **À trancher en phase 6.**
- [ ] Frontend hors scope ? (README : "back-end d'une web application")

## Fichiers

[Readme.md](Readme.md) · [example/millennium-falcon.json](example/millennium-falcon.json) · [example/universe.db](example/universe.db) · [example/answer.json](example/answer.json)
