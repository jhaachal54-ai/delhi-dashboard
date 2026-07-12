import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/http";
import type { ApiEnvelope, RegionWx } from "@/lib/types";
import { describeWmo } from "@/lib/wmo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One Open-Meteo request for all regions: comma-separated coordinates return
// an array of results, so region-wise weather costs a single upstream call.
const REGIONS: { key: string; name: string; lat: number; lng: number }[] = [
  { key: "safdarjung", name: "Safdarjung (Central-South)", lat: 28.586, lng: 77.206 },
  { key: "cp", name: "Connaught Place (Central)", lat: 28.631, lng: 77.217 },
  { key: "najafgarh", name: "Najafgarh (South-West)", lat: 28.609, lng: 76.986 },
  { key: "dwarka", name: "Dwarka", lat: 28.582, lng: 77.05 },
  { key: "palam", name: "Palam (Airport)", lat: 28.589, lng: 77.088 },
  { key: "rohini", name: "Rohini (North-West)", lat: 28.715, lng: 77.113 },
  { key: "narela", name: "Narela (North)", lat: 28.856, lng: 77.092 },
  { key: "east", name: "Mayur Vihar (East)", lat: 28.61, lng: 77.295 },
  { key: "south", name: "Saket (South)", lat: 28.522, lng: 77.212 },
  { key: "noida", name: "Noida", lat: 28.57, lng: 77.325 },
  { key: "gurugram", name: "Gurugram", lat: 28.46, lng: 77.026 },
  { key: "ghaziabad", name: "Ghaziabad", lat: 28.665, lng: 77.431 },
];

const WX_URL =
  "https://api.open-meteo.com/v1/forecast?" +
  new URLSearchParams({
    latitude: REGIONS.map((r) => r.lat).join(","),
    longitude: REGIONS.map((r) => r.lng).join(","),
    current: "temperature_2m,apparent_temperature,precipitation,weather_code,is_day",
    timezone: "Asia/Kolkata",
  }).toString();

const AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?" +
  new URLSearchParams({
    latitude: REGIONS.map((r) => r.lat).join(","),
    longitude: REGIONS.map((r) => r.lng).join(","),
    current: "us_aqi,pm2_5",
    timezone: "Asia/Kolkata",
  }).toString();

export async function GET() {
  try {
    const [wxRes, airRes] = await Promise.all([
      fetchWithTimeout(WX_URL, { timeoutMs: 9000 }),
      fetchWithTimeout(AIR_URL, { timeoutMs: 9000 }),
    ]);
    if (!wxRes.ok) throw new Error(`Open-Meteo regions responded ${wxRes.status}`);
    const json = await wxRes.json();
    // Air quality is a bonus layer — tolerate its failure without killing weather.
    const airJson = airRes.ok ? await airRes.json() : null;
    // Single-location responses are an object; multi-location is an array.
    const arr: any[] = Array.isArray(json) ? json : [json];
    const airArr: any[] = airJson ? (Array.isArray(airJson) ? airJson : [airJson]) : [];

    const regions: RegionWx[] = REGIONS.map((r, i) => {
      const c = arr[i]?.current ?? {};
      const a = airArr[i]?.current ?? {};
      const { description, emoji } = describeWmo(c.weather_code ?? null, c.is_day === 1);
      return {
        key: r.key,
        name: r.name,
        temperature: c.temperature_2m ?? null,
        apparent: c.apparent_temperature ?? null,
        precipitation: c.precipitation ?? null,
        description,
        emoji,
        usAqi: a.us_aqi ?? null,
        pm2_5: a.pm2_5 ?? null,
      };
    });

    const envelope: ApiEnvelope<{ regions: RegionWx[] }> = {
      status: "live",
      source: "Open-Meteo (12 NCR locations)",
      fetchedAt: new Date().toISOString(),
      data: { regions },
    };
    return NextResponse.json(envelope);
  } catch (err) {
    const envelope: ApiEnvelope<{ regions: RegionWx[] }> = {
      status: "error",
      source: "Open-Meteo (12 NCR locations)",
      fetchedAt: new Date().toISOString(),
      note: err instanceof Error ? err.message : "Failed to fetch region weather.",
      data: { regions: [] },
    };
    return NextResponse.json(envelope, { status: 200 });
  }
}
