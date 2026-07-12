import { NextResponse } from "next/server";
import { CITY } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/http";
import type { AirData, ApiEnvelope } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open-Meteo Air Quality API — no key required.
const AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?" +
  new URLSearchParams({
    latitude: String(CITY.lat),
    longitude: String(CITY.lng),
    current:
      "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide",
    hourly: "us_aqi",
    timezone: CITY.timezone,
    past_days: "1",
    // two forecast days so a full 24h of future hours exists even late at night
    forecast_days: "2",
  }).toString();

// US EPA AQI category bands.
export function aqiCategory(aqi: number | null): string {
  if (aqi == null) return "Unknown";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export async function GET() {
  try {
    const res = await fetchWithTimeout(AIR_URL, { timeoutMs: 8000 });
    if (!res.ok) throw new Error(`Open-Meteo air responded ${res.status}`);
    const j = await res.json();
    const c = j?.current ?? {};

    // Split the hourly arrays at "now": trailing 24h for the sparkline,
    // next 24h of forecast for "improves at" hints.
    const times: string[] = j?.hourly?.time ?? [];
    const aqis: (number | null)[] = j?.hourly?.us_aqi ?? [];
    const nowMs = Date.now();
    const points = times.map((t, i) => ({ t, aqi: aqis[i] ?? null }));
    const series = points.filter((p) => new Date(p.t).getTime() <= nowMs).slice(-24);
    const forecast = points.filter((p) => new Date(p.t).getTime() > nowMs).slice(0, 24);

    const usAqi = c.us_aqi ?? null;
    const data: AirData = {
      usAqi,
      category: aqiCategory(usAqi),
      pm2_5: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      no2: c.nitrogen_dioxide ?? null,
      o3: c.ozone ?? null,
      co: c.carbon_monoxide ?? null,
      so2: c.sulphur_dioxide ?? null,
      observedAt: c.time ?? null,
      series,
      forecast,
    };

    const envelope: ApiEnvelope<AirData> = {
      status: "live",
      source: "Open-Meteo Air Quality",
      fetchedAt: new Date().toISOString(),
      data,
    };
    return NextResponse.json(envelope);
  } catch (err) {
    const envelope: ApiEnvelope<AirData> = {
      status: "error",
      source: "Open-Meteo Air Quality",
      fetchedAt: new Date().toISOString(),
      note: err instanceof Error ? err.message : "Failed to fetch air quality.",
      data: {
        usAqi: null,
        category: "Unknown",
        pm2_5: null,
        pm10: null,
        no2: null,
        o3: null,
        co: null,
        so2: null,
        observedAt: null,
        series: [],
        forecast: [],
      },
    };
    return NextResponse.json(envelope, { status: 200 });
  }
}
