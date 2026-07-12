# Delhi City Dashboard

A real-time city guide for **Delhi**, built with Next.js (App Router) + TypeScript.
It pulls **live public data** and is designed to handle the messiness of real feeds —
missing fields, stale GPS fixes, bogus coordinates, and sparse results — gracefully.

## Pages

| Page | What's on it |
|------|--------------|
| `/` Home | "Should I head out?" live score · **Plan Your Visit** (pick a tourist place + your nearest metro station & bus hub → metro line/interchange route, live bus matches, events nearby, famous restaurants) · 14 curated tourist-place cards |
| `/weather` | Live weather, air-quality gauge, 7-day AQI & temperature trend |
| `/events` | All live local events + famous restaurants grouped by area |
| `/transport` | Live bus map (full DTC/DIMTS fleet) + Delhi Metro network with operating status |

The metro journey planner covers the **full DMRC network — all 262 stations, 11 lines**
(generated from the official DMRC GTFS into `src/data/metroNetwork.json`), routing
station-by-station with transfer penalties, platform-signage directions ("towards X")
and stop counts, including branch lines and interchange walkways. The bus finder matches **live GPS positions** near both your hub and the
destination, showing **real painted bus numbers** (mapped from the official OTD static
GTFS via `src/data/busRouteNames.json` — regenerate it from a fresh `routes.txt` if DTC
renumbers routes). Tourist places & restaurants are curated reference data.

## Data feeds

| Panel | Source | Key needed |
|-------|--------|------------|
| 🚌 Live buses | [Delhi Open Transit Data](https://otd.delhi.gov.in) (GTFS‑Realtime protobuf) | Free key |
| 🎫 Local events | [Real-Time Events Search (RapidAPI)](https://rapidapi.com) — Google Events aggregate | Free key |
| 🌫️ Air quality | [Open‑Meteo Air Quality](https://open-meteo.com) | None |
| 🌡️ Weather | [Open‑Meteo Forecast](https://open-meteo.com) | None |

**Air quality and weather work with zero setup.** The bus and event panels show
clearly-labelled sample data until you add API keys, then switch to live automatically.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Enable live buses & events (optional)

1. Copy the env template:
   ```bash
   cp .env.local.example .env.local
   ```
2. Get free keys:
   - **OTD_API_KEY** — register at https://otd.delhi.gov.in
   - **RAPIDAPI_KEY** — sign up at https://rapidapi.com, subscribe to "Real-Time Events Search" (Basic/free), copy the *X-RapidAPI-Key*
3. Paste them into `.env.local` and restart `npm run dev`.

`.env.local` is git-ignored — never commit real keys.

## How the "messy data" handling works

- **GTFS‑Realtime** is decoded from protobuf, then each vehicle is checked for a
  stale timestamp (>2 min) and out-of-bounds / `0,0` coordinates. Bad fixes are
  counted and kept out of the map instead of crashing it.
- Every API route returns a consistent envelope (`status: live | sample | error`)
  and upstream calls have hard timeouts, so one slow/broken feed never freezes the UI.
- Polling pauses when the browser tab is hidden.

## Project layout

```
src/
  app/
    api/{transit,events,air,weather}/route.ts   server-side feed proxies
    page.tsx, layout.tsx, globals.css
  components/                                    dashboard + panels (client)
  lib/                                           config, types, http + polling helpers
```
