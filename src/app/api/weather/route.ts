import { NextResponse } from "next/server";
import { CITY } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/http";
import type { ApiEnvelope, WeatherData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open-Meteo Forecast API — no key required.
const WX_URL =
  "https://api.open-meteo.com/v1/forecast?" +
  new URLSearchParams({
    latitude: String(CITY.lat),
    longitude: String(CITY.lng),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,uv_index",
    daily: "sunrise,sunset",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,is_day",
    // two days so a full 24h of future hours exists even late at night
    forecast_days: "2",
    timezone: CITY.timezone,
  }).toString();

// "2026-07-11T05:31" -> "05:31"
function clockOf(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : null;
}

// WMO weather interpretation codes -> label + emoji.
function describe(code: number | null, isDay: boolean): { description: string; emoji: string } {
  const day = isDay;
  const map: Record<number, [string, string]> = {
    0: ["Clear sky", day ? "☀️" : "🌙"],
    1: ["Mainly clear", day ? "🌤️" : "🌙"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌨️"],
    67: ["Freezing rain", "🌨️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy snow", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Rain showers", "🌧️"],
    82: ["Violent showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm w/ hail", "⛈️"],
    99: ["Thunderstorm w/ hail", "⛈️"],
  };
  if (code == null || !(code in map)) return { description: "—", emoji: day ? "🌡️" : "🌙" };
  const [description, emoji] = map[code];
  return { description, emoji };
}

export async function GET() {
  try {
    const res = await fetchWithTimeout(WX_URL, { timeoutMs: 8000 });
    if (!res.ok) throw new Error(`Open-Meteo weather responded ${res.status}`);
    const j = await res.json();
    const c = j?.current ?? {};
    const isDay = c.is_day === 1;
    const { description, emoji } = describe(c.weather_code ?? null, isDay);

    // Next 24 hours (hourly arrays start at midnight, so skip past hours).
    const hTimes: string[] = j?.hourly?.time ?? [];
    const nowMs = Date.now();
    const hourly = hTimes
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => new Date(t).getTime() > nowMs)
      .slice(0, 24)
      .map(({ t, i }) => {
        const code = j.hourly?.weather_code?.[i] ?? null;
        const day = j.hourly?.is_day?.[i] === 1;
        return {
          t,
          temp: j.hourly?.temperature_2m?.[i] ?? null,
          apparent: j.hourly?.apparent_temperature?.[i] ?? null,
          rainProb: j.hourly?.precipitation_probability?.[i] ?? null,
          code,
          emoji: describe(code, day).emoji,
        };
      });

    const data: WeatherData = {
      temperature: c.temperature_2m ?? null,
      apparent: c.apparent_temperature ?? null,
      humidity: c.relative_humidity_2m ?? null,
      precipitation: c.precipitation ?? null,
      windSpeed: c.wind_speed_10m ?? null,
      isDay,
      code: c.weather_code ?? null,
      description,
      emoji,
      observedAt: c.time ?? null,
      uvIndex: c.uv_index ?? null,
      sunrise: clockOf(j?.daily?.sunrise?.[0]),
      sunset: clockOf(j?.daily?.sunset?.[0]),
      hourly,
    };

    const envelope: ApiEnvelope<WeatherData> = {
      status: "live",
      source: "Open-Meteo Forecast",
      fetchedAt: new Date().toISOString(),
      data,
    };
    return NextResponse.json(envelope);
  } catch (err) {
    const envelope: ApiEnvelope<WeatherData> = {
      status: "error",
      source: "Open-Meteo Forecast",
      fetchedAt: new Date().toISOString(),
      note: err instanceof Error ? err.message : "Failed to fetch weather.",
      data: {
        temperature: null,
        apparent: null,
        humidity: null,
        precipitation: null,
        windSpeed: null,
        isDay: true,
        code: null,
        description: "—",
        emoji: "🌡️",
        observedAt: null,
        uvIndex: null,
        sunrise: null,
        sunset: null,
        hourly: [],
      },
    };
    return NextResponse.json(envelope, { status: 200 });
  }
}
