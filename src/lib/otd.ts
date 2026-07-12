// Shared fetch + decode for the Delhi OTD GTFS-Realtime vehicle feed, with a
// short in-memory cache so multiple API routes (live map, bus finder) hitting
// it in the same window reuse one upstream request.

import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { CITY, STALE_AFTER_SECONDS } from "./config";
import { fetchWithTimeout } from "./http";
import type { Bus } from "./types";

const OTD_URL = (key: string) =>
  `https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${encodeURIComponent(key)}`;

export interface LiveBusFeed {
  hasKey: boolean;
  ok: boolean;
  error?: string;
  buses: Bus[];
  feedTimestamp: number | null;
}

let cache: { at: number; value: LiveBusFeed } | null = null;
const CACHE_TTL_MS = 15_000;

function inBbox(lat: number, lng: number): boolean {
  const b = CITY.bbox;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

export async function getLiveBusFeed(): Promise<LiveBusFeed> {
  const key = process.env.OTD_API_KEY;
  if (!key) return { hasKey: false, ok: false, buses: [], feedTimestamp: null };
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;

  try {
    const res = await fetchWithTimeout(OTD_URL(key), { timeoutMs: 9000 });
    if (!res.ok) throw new Error(`OTD responded ${res.status} ${res.statusText}`);
    const buffer = new Uint8Array(await res.arrayBuffer());
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    const now = Math.floor(Date.now() / 1000);
    const feedTimestamp = feed.header?.timestamp ? Number(feed.header.timestamp) : null;
    const buses: Bus[] = [];

    for (const entity of feed.entity) {
      const v = entity.vehicle;
      const pos = v?.position;
      if (!pos || pos.latitude == null || pos.longitude == null) continue;

      const lat = pos.latitude;
      const lng = pos.longitude;
      const ts = v?.timestamp != null ? Number(v.timestamp) : null;

      buses.push({
        id: String(entity.id ?? v?.vehicle?.id ?? Math.random().toString(36).slice(2)),
        routeId: v?.trip?.routeId ? String(v.trip.routeId) : null,
        lat,
        lng,
        bearing: pos.bearing != null ? Number(pos.bearing) : null,
        speed: pos.speed != null ? Number(pos.speed) : null,
        timestamp: ts,
        stale: ts != null && now - ts > STALE_AFTER_SECONDS,
        suspect: (lat === 0 && lng === 0) || !inBbox(lat, lng),
      });
    }

    const value: LiveBusFeed = { hasKey: true, ok: true, buses, feedTimestamp };
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    // Don't cache failures — the next caller should retry.
    return {
      hasKey: true,
      ok: false,
      error: err instanceof Error ? err.message : "Failed to fetch transit feed.",
      buses: [],
      feedTimestamp: null,
    };
  }
}
