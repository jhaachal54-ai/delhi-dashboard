// Central configuration for the Delhi City Dashboard.

export const CITY = {
  name: "Delhi",
  country: "IN",
  // Connaught Place, roughly the centre of the city.
  lat: 28.6139,
  lng: 77.209,
  timezone: "Asia/Kolkata",
  // Bounding box used to sanity-check bus GPS coordinates and to scale the map.
  // Anything outside this is flagged as a "suspect" fix (real feeds emit junk).
  bbox: {
    minLat: 28.36,
    maxLat: 28.92,
    minLng: 76.82,
    maxLng: 77.42,
  },
} as const;

// How often each panel re-fetches (ms). Buses move fast; air/weather barely change.
export const REFRESH = {
  transit: 20_000,
  events: 15 * 60_000,
  air: 5 * 60_000,
  weather: 5 * 60_000,
  trend: 30 * 60_000,
  regions: 10 * 60_000,
} as const;

// A bus fix older than this (seconds) is considered stale.
export const STALE_AFTER_SECONDS = 120;

// Delhi's live feed carries ~5,000+ vehicles; drawing every one as an animated
// SVG node janks the browser. Cap how many markers the map plots.
export const MAP_PLOT_CAP = 1600;
