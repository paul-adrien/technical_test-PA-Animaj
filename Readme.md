# Millennium Falcon

Backend service that computes one of the fastest routes for the Millennium Falcon to reach a target planet, given a SQLite database of inter-planet routes and the ship's fuel autonomy.

See [SUBJECT.md](SUBJECT.md) for the original problem statement.

## Stack

Node.js 22 · TypeScript · Fastify · Zod · `better-sqlite3` · `heap-js` · Vitest · Biome · Docker

## Quick start — Docker

```bash
cd backend
docker build -t millennium-falcon .

# Mount the directory holding millennium-falcon.json + the SQLite DB at /data
docker run --rm -p 3000:3000 -v "$(pwd)/../example:/data" millennium-falcon
```

Then:

```bash
curl -X POST http://localhost:3000/compute \
  -H "content-type: application/json" \
  -d '{"arrival": "Endor"}'
# → {"duration":8,"route":["Tatooine","Hoth","Endor"]}
```

## Quick start — local (Node.js 22+)

```bash
cd backend
npm ci
npm run dev -- ../example/millennium-falcon.json
```

## API

### `POST /compute`

**Request body**:

```json
{ "arrival": "Endor" }
```

**Response — `200`**:

```json
{ "duration": 8, "route": ["Tatooine", "Hoth", "Endor"] }
```

`duration` includes refuel days. `route` does **not** duplicate a planet on a refuel stop.

**Errors** all share a uniform shape:

```json
{ "error": { "code": "NO_ROUTE", "message": "No route to Endor" } }
```

| Status | Code            | When                                                                |
| ------ | --------------- | ------------------------------------------------------------------- |
| `400`  | `INVALID_BODY`  | Request body fails validation (missing field, wrong type, bad JSON) |
| `404`  | `NO_ROUTE`      | No path between configured `departure` and the requested `arrival`  |
| `500`  | `INTERNAL_ERROR`| Unexpected server error (logged, no internal details leaked)        |

### `GET /health`

Returns `{ "status": "ok" }`. Used by the Docker `HEALTHCHECK`.

## Configuration

The server reads a JSON config file at startup. The path is passed as a CLI argument or via the `CONFIG_PATH` env var.

```json
{
  "autonomy": 6,
  "departure": "Tatooine",
  "routes_db": "universe.db"
}
```

- `autonomy` (positive int): max fuel in days.
- `departure` (string): name of the planet on day 0.
- `routes_db` (string): path to the SQLite DB. **Resolved relative to the config file**, not the current working directory.

The SQLite database must contain a `routes` table:

| Column        | Type             |
| ------------- | ---------------- |
| `origin`      | `TEXT`           |
| `destination` | `TEXT`           |
| `travel_time` | `UNSIGNED INTEGER` |

Routes are bidirectional (a row `A → B (t)` also lets the ship travel `B → A` in `t` days).

## Algorithm

The problem is a **shortest-path search with a state-dependent transition** (the cost of an arc depends on the fuel left when you take it). Plain Dijkstra on planets is not enough — a planet may be visited usefully with several different fuel levels.

**Approach**: Dijkstra on the extended state graph `(planet, fuel_remaining)`. Two transitions from a state `(p, fuel)`:

- **jump** to a neighbour `n` if `fuel ≥ travelTime(p, n)`: new state `(n, fuel - travelTime)`, cost `+travelTime`.
- **refuel** on `p` if `fuel < autonomy`: new state `(p, autonomy)`, cost `+1`.

The first time the search pops a state with `planet == arrival`, the result is provably optimal.

Implementation: [`backend/src/domain/shortest-path.ts`](backend/src/domain/shortest-path.ts).

## Testing

```bash
cd backend
npm run lint
npm run typecheck
npm test
```

A stress test with a 50,000-planet generated graph lives at [`backend/tests/domain/shortest-path.stress.test.ts`](backend/tests/domain/shortest-path.stress.test.ts).

## Project layout

```
backend/
  src/
    app.ts              # Fastify factory (testable without listen)
    server.ts           # entrypoint: load config, build graph, listen
    config.ts           # load + validate millennium-falcon.json
    errors.ts           # HttpError base + typed subclasses
    domain/
      graph.ts          # build adjacency map from travels
      shortest-path.ts  # Dijkstra over (planet, fuel)
    repository/
      database.ts       # open SQLite (read-only)
      travels.ts        # read travels from the routes table
    routes/compute.ts   # POST /compute handler
    schemas/            # Zod schemas
  tests/                # unit + integration tests (mirrors src/)
  Dockerfile
```
