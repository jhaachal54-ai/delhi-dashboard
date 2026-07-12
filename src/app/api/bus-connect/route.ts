import { NextResponse } from "next/server";
import { HUB_BY_KEY } from "@/lib/busHubs";
import { busFare } from "@/lib/busFares";
import { busNumber } from "@/lib/busNames";
import { haversineKm } from "@/lib/geo";
import { getLiveBusFeed } from "@/lib/otd";
import { PLACE_BY_KEY } from "@/lib/places";
import type { ApiEnvelope, BusConnectData, RouteMatch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE = "Delhi Open Transit Data (live positions)";
// Radius around each point within which a bus counts as "serving" it. Delhi
// stops are dense, so ~2km ≈ "walkable / one short ride to the corridor".
const RADIUS_KM = 2.2;

interface Tally {
  count: number;
  lastSeen: number | null;
  verified: boolean;
}

function tallyNear(
  buses: { routeId: string | null; lat: number; lng: number; timestamp: number | null; suspect: boolean }[],
  lat: number,
  lng: number
): Map<string, Tally> {
  const out = new Map<string, Tally>();
  for (const b of buses) {
    if (b.suspect || !b.routeId) continue;
    if (haversineKm(b.lat, b.lng, lat, lng) > RADIUS_KM) continue;
    // Group by the painted bus number (merges the feed's separate UP/DOWN
    // route_ids). Live route_ids missing from the static GTFS snapshot fall
    // back to the raw id, marked unverified so the UI can say so.
    const mapped = busNumber(b.routeId);
    const label = mapped ?? b.routeId;
    const cur = out.get(label) ?? { count: 0, lastSeen: null, verified: mapped != null };
    cur.count += 1;
    cur.verified = cur.verified || mapped != null;
    if (b.timestamp != null && (cur.lastSeen == null || b.timestamp > cur.lastSeen)) {
      cur.lastSeen = b.timestamp;
    }
    out.set(label, cur);
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hub = HUB_BY_KEY.get(searchParams.get("hub") ?? "");
  const place = PLACE_BY_KEY.get(searchParams.get("place") ?? "");

  if (!hub || !place) {
    return NextResponse.json({ error: "Unknown hub or place." }, { status: 400 });
  }

  const empty: BusConnectData = {
    hubName: hub.name,
    placeName: place.name,
    radiusKm: RADIUS_KM,
    common: [],
    nearPlace: [],
  };

  const feed = await getLiveBusFeed();

  if (!feed.hasKey) {
    const envelope: ApiEnvelope<BusConnectData> = {
      status: "sample",
      source: SOURCE,
      fetchedAt: new Date().toISOString(),
      note: "Add OTD_API_KEY in .env.local to match live buses.",
      data: empty,
    };
    return NextResponse.json(envelope);
  }
  if (!feed.ok) {
    const envelope: ApiEnvelope<BusConnectData> = {
      status: "error",
      source: SOURCE,
      fetchedAt: new Date().toISOString(),
      note: feed.error ?? "Transit feed unavailable.",
      data: empty,
    };
    return NextResponse.json(envelope, { status: 200 });
  }

  const nearHub = tallyNear(feed.buses, hub.lat, hub.lng);
  const nearDest = tallyNear(feed.buses, place.lat, place.lng);

  const common: RouteMatch[] = [];
  for (const [route, h] of nearHub) {
    const d = nearDest.get(route);
    if (!d) continue;
    common.push({
      route,
      verified: h.verified || d.verified,
      nearYou: h.count,
      nearPlace: d.count,
      lastSeen: Math.max(h.lastSeen ?? 0, d.lastSeen ?? 0) || null,
      fare: busFare(route),
    });
  }
  // Real, verifiable bus numbers first; within each group, busiest corridor first.
  common.sort(
    (a, b) =>
      Number(b.verified) - Number(a.verified) ||
      b.nearYou + b.nearPlace - (a.nearYou + a.nearPlace)
  );

  const nearPlace: RouteMatch[] = [...nearDest.entries()]
    .map(([route, d]) => ({
      route,
      verified: d.verified,
      nearYou: 0,
      nearPlace: d.count,
      lastSeen: d.lastSeen,
      fare: busFare(route),
    }))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.nearPlace - a.nearPlace)
    .slice(0, 8);

  const envelope: ApiEnvelope<BusConnectData> = {
    status: "live",
    source: SOURCE,
    fetchedAt: new Date().toISOString(),
    data: { ...empty, common: common.slice(0, 8), nearPlace },
  };
  return NextResponse.json(envelope);
}
