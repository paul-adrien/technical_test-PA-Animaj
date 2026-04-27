# Software Eng Technical Test

## What are the odds?

The Death Star - the Empire's ultimate weapon - is almost operational and is currently approaching the Endor planet. The countdown has started.

Han Solo, Chewbacca, Leia and C3PO are currently on Tatooine boarding on the Millennium Falcon. They must reach Endor to join the Rebel fleet and destroy the Death Star before it annihilates the planet.

### Routes

The Millennium Falcon has an onboard map containing the list of all planets in the galaxy, and the number of days it takes to go from one to the other using a Hyperspace jump.

### Autonomy

However, the Millennium Falcon is not the newest ship of its kind, and it has a limited autonomy. If it's lacking fuel to achieve his next Hyperspace jump, it first must stop for 1 day on the nearby planet to refuel.
For example, if its autonomy is 6 days, and it has already done a 4 days Hyperspace jump. It can reach another planet that is 1 or 2 days away from its current position. To reach planets that are 3 days or more away, it must refuel first.

## The mission

Your mission is to create a docker image containing the backend of a web application that computes and displays one of the fastest route so that the Millennium Falcon reaches Endor in time and saves the galaxy.

### Back-end

When it starts, the back-end service will read a JSON configuration file containing the autonomy, the path towards an SQLite database file containing all the routes, and the name of the planet where the Millennium Falcon is currently parked (Tatooine). It will then listen to an endpoint `/compute` for a message containing the name of the planet that the empire wants to destroy (Endor).

**millennium-falcon.json**

```json
{
  "autonomy": 6,
  "departure": "Tatooine",
  "routes_db": "universe.db"
}
```

- autonomy (integer): autonomy of the Millennium Falcon in days.
- departure (string): Planet where the Millennium Falcon is on day 0.
- routes_db (string): Path toward a SQLite database file containing the routes. The path can be either absolute or relative to the location of the `millennium-falcon.json` file itself.

The SQLite database will contain a table named ROUTES. Each row in the table represents a space route. Routes can be travelled **in any direction** (from origin to destination or vice-versa).

- ORIGIN (TEXT): Name of the origin planet. Cannot be null or empty.
- DESTINATION (TEXT): Name of the destination planet. Cannot be null or empty.
- TRAVEL_TIME (INTEGER): Number days needed to travel from one planet to the other. Must be strictly positive.

| ORIGIN   | DESTINATION | TRAVEL_TIME |
| -------- | ----------- | ----------- |
| Tatooine | Dagobah     | 4           |
| Dagobah  | Endor       | 1           |

**request payload**

```json
{
  "arrival": "Endor"
}
```

- arrival (string): Planet the Millennium Falcon needs to reach.

## Example

**[universe.db](example/universe.db?raw=true)** (click to download)
| ORIGIN | DESTINATION | TRAVEL_TIME |
|----------|-------------|-------------|
| Tatooine | Dagobah | 6 |
| Dagobah | Endor | 4 |
| Dagobah | Hoth | 1 |
| Hoth | Endor | 1 |
| Tatooine | Hoth | 6 |

**[millennium-falcon.json](example/millennium-falcon.json?raw=true)** (click to download)

```json
{
  "autonomy": 6,
  "departure": "Tatooine",
  "routes_db": "universe.db"
}
```

Request payload:

```json
{
  "arrival": "Endor"
}
```

The endpoint should return :

```json
{
  "duration": 8,
  "route": ["Tatooine", "Hoth", "Endor"]
}
```

(the Millennium Falcon must refuel for 1 day on Hoth).

## Final note

The only constraint on the technological stack is to provide a docker image that could be build and run on a laptop. Except from that, you are free to use whatever technology you think is best suited for the task.

We are looking for high quality code: typically something that you would put into production and be proud of.

Have fun!
