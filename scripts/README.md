# Data generators

One-off scripts that turn raw GTFS / web data into the JSON files in `src/data/`.
Run each from the **project root**: `node scripts/<name>.mjs`

| Script | Input | Output |
|---|---|---|
| `gen-metro.mjs` | `gtfs/dmrc/` (DMRC GTFS, committed) | `metroNetwork.json` — stations, patterns, travel times, service hours |
| `gen-bus-names.mjs` | `Downloads/GTFS/routes.txt` (bus GTFS) | `busRouteNames.json` — route_id → painted bus number |
| `gen-fares.mjs` | `Downloads/GTFS/fare_attributes.txt` | `busFares.json` — bus number → [min, max] fare |
| `gen-bus-stops.mjs` | `Downloads/GTFS/stops.txt` | `busStops.json` — every bus stop with coords |
| `gen-bus-routes.mjs` | `Downloads/GTFS/stop_times.txt` (+ trips, stops) | `busRoutePaths.json` — bus number → ordered stop coords |
| `gen-place-images.mjs` | Wikipedia REST API (internet) | `placeImages.json` — place key → Wikimedia thumbnail URL |

The **bus GTFS** is the ~350MB zip from https://otd.delhi.gov.in (login required),
extracted to `C:/Users/USER/Downloads/GTFS`. It is too large to
commit; re-download it if DTC renumbers routes, then rerun the bus generators.
The **DMRC GTFS** is small and committed under `gtfs/dmrc/`.
