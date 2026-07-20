// Shared response shapes. Every API route returns an ApiEnvelope so the client
// can render consistent "live / sample / error" states without special-casing.

export type DataStatus = "live" | "sample" | "error";

export interface ApiEnvelope<T> {
  status: DataStatus;
  source: string; // human-readable data source
  fetchedAt: string; // ISO timestamp of when we fetched
  note?: string; // e.g. "Add OTD_API_KEY to see live data"
  data: T;
}

// ─── Transit ────────────────────────────────────────────────────────────────
export interface Bus {
  id: string;
  routeId: string | null;
  lat: number;
  lng: number;
  bearing: number | null;
  speed: number | null; // m/s as reported (often missing / unreliable)
  timestamp: number | null; // unix seconds
  stale: boolean;
  suspect: boolean; // coords look bogus (0,0 or outside the city bbox)
}

export interface TransitData {
  buses: Bus[];
  stats: {
    total: number;
    withRoute: number;
    routes: number; // distinct route IDs currently on the road
    fresh: number; // fixes newer than the stale threshold
    stale: number;
    suspectCoords: number;
    feedTimestamp: number | null;
  };
  plotted: number; // how many markers the map is actually drawing (may be capped)
}

// ─── Events ─────────────────────────────────────────────────────────────────
export interface EventItem {
  id: string;
  name: string;
  date: string | null; // ISO or null when TBA
  dateLabel: string; // pretty label, "Date TBA" when unknown
  venue: string | null;
  segment: string | null; // Music / Sports / Arts...
  priceLabel: string | null;
  url: string | null;
  image: string | null;
  lat: number | null; // venue coords when the feed provides them
  lng: number | null;
}

export interface EventsData {
  events: EventItem[];
  total: number;
}

// ─── Air quality ──────────────────────────────────────────────────────────────
export interface AirData {
  usAqi: number | null;
  category: string;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  co: number | null;
  so2: number | null;
  dust: number | null; // µg/m³ — Saharan/Thar dust, very relevant to Delhi
  observedAt: string | null;
  // Last ~24h of US AQI values for a sparkline (nulls preserved as gaps).
  series: { t: string; aqi: number | null }[];
  // Next ~24h forecast AQI (Open-Meteo model), for "improves at" hints.
  forecast: { t: string; aqi: number | null }[];
}

// ─── Bus finder ───────────────────────────────────────────────────────────────
export interface RouteMatch {
  route: string; // bus route number / ID as reported by the live feed
  verified: boolean; // true = real painted number from static GTFS; false = raw feed ref
  nearYou: number; // live buses on this route near the user's hub right now
  nearPlace: number; // live buses on this route near the destination right now
  lastSeen: number | null; // unix seconds of the freshest fix
  fare: [number, number] | null; // [min, max] INR from static GTFS fares
}

export interface BusConnectData {
  hubName: string;
  placeName: string;
  radiusKm: number;
  common: RouteMatch[]; // routes with live buses near BOTH points
  nearPlace: RouteMatch[]; // fallback: routes active near the destination
}

// ─── 7-day trend ──────────────────────────────────────────────────────────────
export interface TrendDay {
  date: string; // ISO date (yyyy-mm-dd)
  label: string; // "Mon 7"
  isToday: boolean;
  tMax: number | null;
  tMin: number | null;
  aqi: number | null; // daily mean US AQI
  rain: number | null; // daily precipitation sum, mm
}

export interface TrendData {
  days: TrendDay[];
}

// ─── Region-wise weather ──────────────────────────────────────────────────────
export interface RegionWx {
  key: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number | null;
  apparent: number | null;
  precipitation: number | null; // mm in the current period
  description: string;
  emoji: string;
  usAqi: number | null;
  pm2_5: number | null;
}

// ─── Hourly forecast ──────────────────────────────────────────────────────────
export interface HourlyWx {
  t: string; // local ISO "2026-07-12T20:00"
  temp: number | null;
  apparent: number | null;
  rainProb: number | null; // 0–100 %
  code: number | null;
  emoji: string;
}

// ─── Weather ──────────────────────────────────────────────────────────────────
export interface DailyWx {
  date: string; // "2026-07-15"
  label: string; // "Wed 15"
  tempMax: number | null;
  tempMin: number | null;
  rainSum: number | null; // mm
  rainProb: number | null; // 0–100 %
  code: number | null;
  emoji: string;
}

export interface WeatherData {
  temperature: number | null;
  apparent: number | null;
  humidity: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  isDay: boolean;
  code: number | null;
  description: string;
  emoji: string;
  observedAt: string | null;
  uvIndex: number | null;
  sunrise: string | null; // "06:12" IST
  sunset: string | null;
  hourly: HourlyWx[]; // next 24 hours
  daily: DailyWx[]; // next 7 days
}

// ─── Flights (IGI Airport) ────────────────────────────────────────────────────
export interface FlightItem {
  flight: string; // "AI 809"
  airline: string;
  city: string; // origin (arrivals) or destination (departures)
  time: string; // "14:35" scheduled, IST
  status: string; // "On time", "Delayed", "Landed"...
  terminal: string | null;
  direction: "arrival" | "departure";
}
export interface FlightsData {
  arrivals: FlightItem[];
  departures: FlightItem[];
}

// ─── Trains (New Delhi departures) ────────────────────────────────────────────
export interface TrainItem {
  number: string; // "12951"
  name: string; // "Mumbai Rajdhani"
  to: string; // destination
  departs: string; // "16:25"
  platform: string | null;
  status: string; // "On time" / "Delayed 20m"
}
export interface TrainsData {
  station: string; // "New Delhi (NDLS)"
  trains: TrainItem[];
}

// ─── Currency (tourist rates) ─────────────────────────────────────────────────
export interface RatesData {
  base: "INR";
  perUsd: number | null; // ₹ per 1 USD
  perEur: number | null;
  perGbp: number | null;
}

// ─── City news ────────────────────────────────────────────────────────────────
export interface NewsItem {
  title: string;
  source: string;
  url: string | null;
  publishedAt: string | null;
  image: string | null;
}
export interface NewsData {
  items: NewsItem[];
}
