import type { AirData, EventsData, WeatherData } from "./types";

export interface HeadOutScore {
  score: number; // 0–100
  verdict: string;
  color: string;
  cta: string; // the follow-up line shown under the verdict
  outlook: string | null; // e.g. "Air should improve to ~120 around 8 pm"
  reasons: { icon: string; text: string; tone: "good" | "warn" | "bad" }[];
  ready: boolean; // false until we have at least air + weather
}

// US EPA AQI category label (region feed carries only the number, not a label).
function aqiBand(aqi: number | null): string {
  if (aqi == null) return "";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

// Open-Meteo hourly times are timezone-local strings ("2026-07-11T20:00");
// read the hour straight off the string to avoid Date timezone ambiguity.
function hourLabel(t: string): string {
  const h = Number(t.split("T")[1]?.slice(0, 2));
  if (!Number.isFinite(h)) return t;
  const twelve = ((h + 11) % 12) + 1;
  return `${twelve} ${h >= 12 ? "pm" : "am"}`;
}

// Scan the next ~12 forecast hours for a meaningful AQI shift.
function airOutlook(air: AirData | null): string | null {
  const now = air?.usAqi;
  const ahead = (air?.forecast ?? [])
    .slice(0, 12)
    .filter((p): p is { t: string; aqi: number } => p.aqi != null);
  if (now == null || ahead.length === 0) return null;
  const better = ahead.find((p) => p.aqi <= now - 30);
  if (better) {
    return `Air should improve to ~${Math.round(better.aqi)} around ${hourLabel(better.t)} — time your outing`;
  }
  const worse = ahead.find((p) => p.aqi >= now + 30);
  if (worse) {
    return `Air may worsen to ~${Math.round(worse.aqi)} by ${hourLabel(worse.t)} — sooner is better`;
  }
  return null;
}

// Verdict + follow-up line per score band, most demanding band first.
const BANDS: { min: number; verdict: string; color: string; cta: string }[] = [
  {
    min: 90,
    verdict: "Perfect Delhi day — don't waste it!",
    color: "#2dd4bf",
    cta: "Days like this are rare here — monuments, markets, long walks, everything works. Pick a spot 👇",
  },
  {
    min: 70,
    verdict: "Great time to head out",
    color: "#4ade80",
    cta: "Great conditions — pick a spot below and make a day of it 👇",
  },
  {
    min: 60,
    verdict: "Decent — go for it",
    color: "#a3e635",
    cta: "Solid conditions for an outing — pick a spot and see what's on nearby 👇",
  },
  {
    min: 50,
    verdict: "Okay — a short outing works",
    color: "#facc15",
    cta: "Good enough for a market run or a nearby monument — find the easiest route below 👇",
  },
  {
    min: 40,
    verdict: "Not great — keep it short",
    color: "#fbbf24",
    cta: "If you go, pick somewhere close and easy — plan the quickest route below 👇",
  },
  {
    min: 20,
    verdict: "Better to stay in",
    color: "#fb923c",
    cta: "…but if you still want to go, plan it smart: metro routes, buses, food & events for every big spot 👇",
  },
  {
    min: 0,
    verdict: "Going out can be hazardous",
    color: "#f43f5e",
    cta: "Stay in unless you must. If it can't wait: N95 mask, keep it brief, prefer the metro — plan below 👇",
  },
];

// A single "should I head out right now?" score for Delhi, blending air
// quality, how hot it feels, rain, and whether anything's happening tonight.
// Deliberately opinionated for a hot, polluted city: AQI and heat dominate.
// When the user's location is known, we swap in their nearest region's AQI so
// the verdict reflects the air where they actually are, not always Connaught Place.
export interface ScoreOpts {
  aqiOverride?: number | null;
  aqiLabel?: string | null; // e.g. "Rohini (North-West)"
}

export function computeHeadOut(
  air: AirData | null,
  weather: WeatherData | null,
  events: EventsData | null,
  opts: ScoreOpts = {}
): HeadOutScore {
  const reasons: HeadOutScore["reasons"] = [];
  let score = 100;

  // Air quality — the biggest lever in Delhi. Prefer the user's nearest-region
  // reading when we have it; fall back to the default (central) air feed.
  const usingRegion = opts.aqiOverride != null;
  const aqi = usingRegion ? opts.aqiOverride! : air?.usAqi ?? null;
  const aqiCategory = usingRegion ? aqiBand(aqi) : air?.category ?? "";
  if (aqi != null) {
    let penalty = 0;
    if (aqi <= 50) penalty = 0;
    else if (aqi <= 100) penalty = 12;
    else if (aqi <= 150) penalty = 28;
    else if (aqi <= 200) penalty = 48;
    else if (aqi <= 300) penalty = 70;
    else penalty = 90;
    score -= penalty;
    reasons.push({
      icon: "🌫️",
      text: `Air quality ${aqi} · ${aqiCategory}${usingRegion && opts.aqiLabel ? ` · ${opts.aqiLabel}` : ""}`.trim(),
      tone: aqi <= 100 ? "good" : aqi <= 150 ? "warn" : "bad",
    });
  }

  // Heat — use "feels like" (apparent) temperature.
  const feels = weather?.apparent ?? weather?.temperature ?? null;
  if (feels != null) {
    let penalty = 0;
    if (feels <= 32) penalty = 0;
    else if (feels <= 38) penalty = 10;
    else if (feels <= 42) penalty = 24;
    else penalty = 40;
    if (feels < 6) penalty = 16; // rare Delhi cold snap
    score -= penalty;
    reasons.push({
      icon: "🌡️",
      text: `Feels like ${Math.round(feels)}°`,
      tone: feels <= 38 ? "good" : feels <= 42 ? "warn" : "bad",
    });
  }

  // Rain / storms.
  const precip = weather?.precipitation ?? 0;
  const stormy = weather?.code != null && weather.code >= 61;
  if (precip > 0 || stormy) {
    score -= 15;
    reasons.push({
      icon: "🌧️",
      text: weather?.description ? weather.description : "Wet weather",
      tone: "warn",
    });
  }

  // Something to do tonight? Small bonus.
  const n = events?.events.length ?? 0;
  if (n > 0) {
    score += 8;
    reasons.push({
      icon: "🎫",
      text: `${n} event${n === 1 ? "" : "s"} on nearby`,
      tone: "good",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];

  return {
    score,
    verdict: band.verdict,
    color: band.color,
    cta: band.cta,
    outlook: airOutlook(air),
    reasons,
    ready: air != null && weather != null,
  };
}
