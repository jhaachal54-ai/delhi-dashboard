import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/http";
import { readFresh, readStale, write } from "@/lib/serverCache";
import type { ApiEnvelope, TrainItem, TrainsData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache the board for an hour so the IRCTC free tier isn't exhausted.
const CACHE_TTL_MS = 60 * 60_000;

// IRCTC data on RapidAPI (irctc1.p.rapidapi.com) — same RAPIDAPI_KEY as events,
// needs its own subscription. Until subscribed we serve a sample departures
// board for New Delhi (NDLS).
const RAPID_HOST = "irctc1.p.rapidapi.com";

export async function GET() {
  const cached = readFresh<TrainsData>("trains", CACHE_TTL_MS);
  if (cached) return NextResponse.json(cached);
  const envelope = await build();
  write("trains", envelope);
  return NextResponse.json(envelope);
}

async function build(): Promise<ApiEnvelope<TrainsData>> {
  const key = process.env.RAPIDAPI_KEY;
  if (key) {
    try {
      const url = `https://${RAPID_HOST}/api/v3/getLiveStation?fromStationCode=NDLS&hours=4`;
      const res = await fetchWithTimeout(url, {
        timeoutMs: 9000,
        headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": RAPID_HOST },
      });
      if (!res.ok) throw new Error(`IRCTC responded ${res.status}`);
      const j = await res.json();
      const list: any[] = Array.isArray(j?.data) ? j.data : [];
      // This endpoint is an upcoming-departures timetable (no live delay or
      // platform). The train name is "ORIGIN - DESTINATION <type>", so the
      // destination is the segment after the dash.
      const trains: TrainItem[] = list.slice(0, 10).map((t) => {
        const name: string = t?.trainName ?? "—";
        const dash = name.split(" - ");
        const to = dash.length > 1 ? dash[1].replace(/\s+(Local|Express|SF|Special)$/i, "") : "";
        const type = String(t?.trainType ?? "").toUpperCase();
        return {
          number: String(t?.trainNumber ?? "—"),
          name,
          to,
          departs: t?.departureTime ?? t?.arrivalTime ?? "—",
          platform: null,
          status: type === "SUBURBAN" ? "Local" : type ? type.charAt(0) + type.slice(1).toLowerCase() : "Scheduled",
        };
      });
      if (trains.length === 0) throw new Error("no trains");
      return {
        status: "live",
        source: "IRCTC · New Delhi (NDLS) · upcoming",
        fetchedAt: new Date().toISOString(),
        data: { station: "New Delhi (NDLS)", trains },
      };
    } catch {
      /* fall through to last-good or sample */
    }
  }
  const stale = readStale<TrainsData>("trains");
  if (stale && stale.status === "live") {
    return { ...stale, note: "Showing the last live board — upstream is unavailable right now." };
  }
  return {
    status: "sample",
    source: "IRCTC · New Delhi (NDLS)",
    fetchedAt: new Date().toISOString(),
    note: key
      ? "Subscribe your RapidAPI key to an IRCTC API to see live departures — showing a sample board."
      : "Add a RapidAPI key subscribed to an IRCTC API to see live departures — showing a sample board.",
    data: sampleTrains(),
  };
}

function sampleTrains(): TrainsData {
  return {
    station: "New Delhi (NDLS)",
    trains: [
      { number: "12951", name: "Mumbai Rajdhani", to: "Mumbai Central", departs: "16:25", platform: "5", status: "On time" },
      { number: "12002", name: "Bhopal Shatabdi", to: "Bhopal (Rani Kamlapati)", departs: "16:00", platform: "1", status: "On time" },
      { number: "12259", name: "Sealdah Duronto", to: "Sealdah", departs: "16:40", platform: "9", status: "Delayed 15m" },
      { number: "12015", name: "Ajmer Shatabdi", to: "Ajmer", departs: "16:50", platform: "3", status: "On time" },
      { number: "12417", name: "Prayagraj Express", to: "Prayagraj Jn", departs: "17:10", platform: "12", status: "On time" },
    ],
  };
}
