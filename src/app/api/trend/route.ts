import { NextResponse } from "next/server";
import { CITY } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/http";
import type { ApiEnvelope, TrendData, TrendDay } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WX_URL =
  "https://api.open-meteo.com/v1/forecast?" +
  new URLSearchParams({
    latitude: String(CITY.lat),
    longitude: String(CITY.lng),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    past_days: "6",
    forecast_days: "1",
    timezone: CITY.timezone,
  }).toString();

const AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?" +
  new URLSearchParams({
    latitude: String(CITY.lat),
    longitude: String(CITY.lng),
    hourly: "us_aqi",
    past_days: "6",
    forecast_days: "1",
    timezone: CITY.timezone,
  }).toString();

function istTodayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CITY.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function label(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

export async function GET() {
  try {
    const [wxRes, airRes] = await Promise.all([
      fetchWithTimeout(WX_URL, { timeoutMs: 8000 }),
      fetchWithTimeout(AIR_URL, { timeoutMs: 8000 }),
    ]);
    if (!wxRes.ok) throw new Error(`weather ${wxRes.status}`);
    if (!airRes.ok) throw new Error(`air ${airRes.status}`);
    const wx = await wxRes.json();
    const air = await airRes.json();

    const dates: string[] = wx?.daily?.time ?? [];
    const tMax: (number | null)[] = wx?.daily?.temperature_2m_max ?? [];
    const tMin: (number | null)[] = wx?.daily?.temperature_2m_min ?? [];
    const rain: (number | null)[] = wx?.daily?.precipitation_sum ?? [];

    // Aggregate hourly AQI into a daily mean.
    const aTimes: string[] = air?.hourly?.time ?? [];
    const aVals: (number | null)[] = air?.hourly?.us_aqi ?? [];
    const byDay = new Map<string, number[]>();
    aTimes.forEach((t, i) => {
      const day = t.slice(0, 10);
      const v = aVals[i];
      if (v == null) return;
      const arr = byDay.get(day) ?? [];
      arr.push(v);
      byDay.set(day, arr);
    });
    const dailyAqi = (day: string): number | null => {
      const arr = byDay.get(day);
      if (!arr || arr.length === 0) return null;
      return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    };

    const today = istTodayStr();
    const days: TrendDay[] = dates.map((date, i) => ({
      date,
      label: label(date),
      isToday: date === today,
      tMax: tMax[i] ?? null,
      tMin: tMin[i] ?? null,
      aqi: dailyAqi(date),
      rain: rain[i] ?? null,
    }));

    const envelope: ApiEnvelope<TrendData> = {
      status: "live",
      source: "Open-Meteo (7-day history)",
      fetchedAt: new Date().toISOString(),
      data: { days },
    };
    return NextResponse.json(envelope);
  } catch (err) {
    const envelope: ApiEnvelope<TrendData> = {
      status: "error",
      source: "Open-Meteo (7-day history)",
      fetchedAt: new Date().toISOString(),
      note: err instanceof Error ? err.message : "Failed to fetch trend.",
      data: { days: [] },
    };
    return NextResponse.json(envelope, { status: 200 });
  }
}
