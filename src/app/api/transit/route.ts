import { NextResponse } from "next/server";
import { busNumber } from "@/lib/busNames";
import { MAP_PLOT_CAP, STALE_AFTER_SECONDS } from "@/lib/config";
import { getLiveBusFeed } from "@/lib/otd";
import type { ApiEnvelope, Bus, TransitData } from "@/lib/types";

// GTFS-Realtime decoding needs Node APIs (Buffer), not the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE = "Delhi Open Transit Data (GTFS-Realtime)";

export async function GET() {
  const feed = await getLiveBusFeed();

  if (!feed.hasKey) {
    const envelope: ApiEnvelope<TransitData> = {
      status: "sample",
      source: SOURCE,
      fetchedAt: new Date().toISOString(),
      note: "Add OTD_API_KEY in .env.local to stream live DTC/DIMTS buses.",
      data: sampleTransit(),
    };
    return NextResponse.json(envelope);
  }

  if (!feed.ok) {
    const envelope: ApiEnvelope<TransitData> = {
      status: "error",
      source: SOURCE,
      fetchedAt: new Date().toISOString(),
      note: feed.error ?? "Failed to fetch transit feed.",
      data: { buses: [], plotted: 0, stats: emptyStats() },
    };
    return NextResponse.json(envelope, { status: 200 });
  }

  const buses = feed.buses;
  const staleCount = buses.filter((b) => b.stale).length;
  // Count distinct painted bus numbers (the feed keeps UP/DOWN as separate ids).
  const routes = new Set(
    buses.filter((b) => b.routeId).map((b) => busNumber(b.routeId) ?? b.routeId)
  ).size;
  // Only ship the markers the map will actually draw (the feed is huge), with
  // route ids swapped for the real bus numbers so tooltips read like signage.
  const plottable = buses
    .filter((b) => !b.suspect)
    .slice(0, MAP_PLOT_CAP)
    .map((b) => ({ ...b, routeId: busNumber(b.routeId) ?? b.routeId }));

  const data: TransitData = {
    buses: plottable,
    plotted: plottable.length,
    stats: {
      total: buses.length,
      withRoute: buses.filter((b) => b.routeId).length,
      routes,
      fresh: buses.length - staleCount,
      stale: staleCount,
      suspectCoords: buses.filter((b) => b.suspect).length,
      feedTimestamp: feed.feedTimestamp,
    },
  };

  const envelope: ApiEnvelope<TransitData> = {
    status: "live",
    source: SOURCE,
    fetchedAt: new Date().toISOString(),
    data,
  };
  return NextResponse.json(envelope);
}

function emptyStats(): TransitData["stats"] {
  return {
    total: 0,
    withRoute: 0,
    routes: 0,
    fresh: 0,
    stale: 0,
    suspectCoords: 0,
    feedTimestamp: null,
  };
}

// A few plausible buses scattered around Delhi so the UI has something to show
// before a live key is configured. Clearly flagged as "sample" in the envelope.
function sampleTransit(): TransitData {
  const seeds: [number, number, string | null][] = [
    [28.6329, 77.2195, "534"],
    [28.5921, 77.046, "764"],
    [28.7041, 77.1025, "GL-23"],
    [28.5355, 77.391, "OMS+"],
    [28.4595, 77.0266, null],
    [28.6692, 77.4538, "185"],
    [28.6139, 77.209, "419"],
    [28.5245, 77.185, "970"],
  ];
  const now = Math.floor(Date.now() / 1000);
  const buses: Bus[] = seeds.map(([lat, lng, routeId], i) => ({
    id: `sample-${i}`,
    routeId,
    lat,
    lng,
    bearing: (i * 45) % 360,
    speed: i % 3 === 0 ? 0 : 3 + i,
    timestamp: now - (i % 4) * 40,
    stale: (i % 4) * 40 > STALE_AFTER_SECONDS,
    suspect: false,
  }));
  const staleCount = buses.filter((b) => b.stale).length;
  return {
    buses,
    plotted: buses.length,
    stats: {
      total: buses.length,
      withRoute: buses.filter((b) => b.routeId).length,
      routes: new Set(buses.filter((b) => b.routeId).map((b) => b.routeId)).size,
      fresh: buses.length - staleCount,
      stale: staleCount,
      suspectCoords: 0,
      feedTimestamp: now,
    },
  };
}
