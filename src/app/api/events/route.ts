import { NextResponse } from "next/server";
import { generateEvents } from "@/lib/curatedEvents";
import type { ApiEnvelope, EventsData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Local events now come from a curated baseline of Delhi's genuinely recurring
// happenings (monument shows, weekly bazaars & qawwali, annual festivals),
// expanded into upcoming dated instances. This replaces the Real-Time Events
// Search (RapidAPI) feed, whose free tier (50 calls/month) kept running out —
// the curated source is free forever, never empty, and needs no API key.
export async function GET() {
  const data: EventsData = generateEvents();
  const envelope: ApiEnvelope<EventsData> = {
    status: "live",
    source: "Curated Delhi guide · recurring events",
    fetchedAt: new Date().toISOString(),
    data,
  };
  return NextResponse.json(envelope);
}
