import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/http";
import { readFresh, readStale, write } from "@/lib/serverCache";
import type { ApiEnvelope, FlightItem, FlightsData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache the board for an hour so AeroDataBox's small free tier isn't exhausted:
// the upstream is called at most once per hour regardless of client polling.
const CACHE_TTL_MS = 60 * 60_000;

// AeroDataBox on RapidAPI covers IGI (DEL). Uses the same RAPIDAPI_KEY as events,
// but that key must be subscribed to AeroDataBox too (403 "not subscribed"
// otherwise) — until then we serve clearly-labelled sample boards.
const RAPID_HOST = "aerodatabox.p.rapidapi.com";

// AeroDataBox local time is "2026-07-14 09:59+05:30" (space, not T).
function hhmm(local: string | null | undefined): string {
  if (!local) return "—";
  const t = String(local).split(" ")[1];
  return t ? t.slice(0, 5) : "—";
}

function mapFlights(raw: any, direction: "arrival" | "departure"): FlightItem[] {
  const list: any[] = Array.isArray(raw) ? raw : [];
  return list.slice(0, 8).map((f) => {
    // Each flight carries a single `movement` for the queried direction; its
    // airport is the other end (origin for arrivals, destination for departures).
    const m = f?.movement ?? {};
    return {
      flight: f?.number ?? "—",
      airline: f?.airline?.name ?? "—",
      city: m?.airport?.name ?? m?.airport?.municipalityName ?? "—",
      time: hhmm(m?.scheduledTime?.local),
      status: f?.status ?? "Scheduled",
      terminal: m?.terminal ?? null,
      direction,
    };
  });
}

export async function GET() {
  const cached = readFresh<FlightsData>("flights", CACHE_TTL_MS);
  if (cached) return NextResponse.json(cached);
  const envelope = await build();
  write("flights", envelope);
  return NextResponse.json(envelope);
}

async function build(): Promise<ApiEnvelope<FlightsData>> {
  const key = process.env.RAPIDAPI_KEY;
  if (key) {
    try {
      // AeroDataBox: flights at an airport within a time window.
      const now = new Date();
      const from = new Date(now.getTime() - 60 * 60000).toISOString().slice(0, 16);
      const to = new Date(now.getTime() + 6 * 3600000).toISOString().slice(0, 16);
      const url = `https://${RAPID_HOST}/flights/airports/iata/DEL/${from}/${to}?withLeg=true&direction=Both&withCancelled=false&withCodeshared=false`;
      const res = await fetchWithTimeout(url, {
        timeoutMs: 9000,
        headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST },
      });
      if (!res.ok) throw new Error(`AeroDataBox responded ${res.status}`);
      const j = await res.json();
      const data: FlightsData = {
        arrivals: mapFlights(j?.arrivals, "arrival"),
        departures: mapFlights(j?.departures, "departure"),
      };
      if (data.arrivals.length + data.departures.length === 0) throw new Error("no flights");
      return {
        status: "live",
        source: "AeroDataBox · IGI (DEL)",
        fetchedAt: new Date().toISOString(),
        data,
      };
    } catch {
      /* fall through to last-good or sample */
    }
  }
  // Prefer the last live board (if any) over sample when upstream is unavailable.
  const stale = readStale<FlightsData>("flights");
  if (stale && stale.status === "live") {
    return { ...stale, note: "Showing the last live board — upstream is unavailable right now." };
  }
  return {
    status: "sample",
    source: "AeroDataBox · IGI (DEL)",
    fetchedAt: new Date().toISOString(),
    note: key
      ? "Subscribe your RapidAPI key to AeroDataBox to see live IGI flights — showing a sample board."
      : "Add a RapidAPI key subscribed to AeroDataBox to see live IGI flights — showing a sample board.",
    data: sampleFlights(),
  };
}

function sampleFlights(): FlightsData {
  return {
    arrivals: [
      { flight: "AI 302", airline: "Air India", city: "Mumbai", time: "14:20", status: "Landed", terminal: "T3", direction: "arrival" },
      { flight: "6E 512", airline: "IndiGo", city: "Bengaluru", time: "14:45", status: "On time", terminal: "T1", direction: "arrival" },
      { flight: "UK 720", airline: "Vistara", city: "Kolkata", time: "15:05", status: "Delayed", terminal: "T3", direction: "arrival" },
      { flight: "EK 510", airline: "Emirates", city: "Dubai", time: "15:30", status: "On time", terminal: "T3", direction: "arrival" },
    ],
    departures: [
      { flight: "AI 809", airline: "Air India", city: "Chennai", time: "14:35", status: "Boarding", terminal: "T3", direction: "departure" },
      { flight: "6E 2043", airline: "IndiGo", city: "Goa", time: "15:00", status: "On time", terminal: "T1", direction: "departure" },
      { flight: "UK 995", airline: "Vistara", city: "Dubai", time: "15:20", status: "On time", terminal: "T3", direction: "departure" },
      { flight: "SG 8169", airline: "SpiceJet", city: "Ahmedabad", time: "15:50", status: "Delayed", terminal: "T1", direction: "departure" },
    ],
  };
}
