import { NextResponse } from "next/server";
import stops from "@/data/busStops.json";
import { haversineKm } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STOPS = stops as unknown as [string, number, number][];

// The 3 closest real bus stops (from the 10.5k-stop static GTFS) to a point.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  const best: { name: string; km: number }[] = [];
  for (const [name, sLat, sLng] of STOPS) {
    const km = haversineKm(lat, lng, sLat, sLng);
    if (best.length < 3) {
      best.push({ name, km });
      best.sort((a, b) => a.km - b.km);
    } else if (km < best[2].km) {
      best[2] = { name, km };
      best.sort((a, b) => a.km - b.km);
    }
  }
  return NextResponse.json({ stops: best.map((s) => ({ ...s, km: Math.round(s.km * 100) / 100 })) });
}
