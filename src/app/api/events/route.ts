import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/http";
import type { ApiEnvelope, EventItem, EventsData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Real-Time Events Search (RapidAPI) — aggregates Google Events results, which
// cover Delhi well (BookMyShow / Insider / AllEvents listings show up here).
const RAPID_HOST = "real-time-events-search.p.rapidapi.com";
const EVENTS_URL =
  `https://${RAPID_HOST}/search-events?` +
  new URLSearchParams({
    query: "events in Delhi",
    date: "month", // upcoming this month
    is_virtual: "false",
    start: "0",
  }).toString();

function fmtDate(iso: string | null): string {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

// Google Events has no category field, so infer one. We scan the title first
// (strong signal) and fall back to the description. Order matters: more specific
// / higher-priority genres are checked first.
const GENRE_RULES: [string, RegExp][] = [
  ["Comedy", /\b(comedy|stand[-\s]?up|standup|open mic|comic|comedian|roast|improv|humou?r)\b/],
  ["Music", /\b(concert|live band|\bdj\b|gig|unplugged|symphony|orchestra|singer|sufi|qawwali|bollywood night|techno|house music|edm|rap|hip[-\s]?hop|jazz|acoustic|tribute)\b/],
  ["Nightlife", /\b(party|nightlife|club night|rooftop|brunch|ladies night|after ?party|cocktail)\b/],
  ["Sports", /\b(match|cricket|football|marathon|run|tournament|\bipl\b|league|fitness|yoga|cycling|trek)\b/],
  ["Theatre", /\b(theatre|theater|\bplay\b|drama|natak|musical|dastangoi)\b/],
  ["Arts", /\b(art|exhibition|museum|gallery|painting|dance|kathak|photography|craft|poetry|open ?mic)\b/],
  ["Tech", /\b(workshop|conference|summit|meetup|hackathon|expo|seminar|webinar|bootcamp|startup|networking)\b/],
  ["Food", /\b(food|culinary|tasting|wine|beer|brewery|dining|supper|pop[-\s]?up kitchen)\b/],
  ["Festival", /\b(festival|\bfest\b|carnival|mela|fair|market|bazaar|flea)\b/],
  ["Dating", /\b(singles|speed dating|matchmaking|blind date|socializing)\b/],
  ["Kids", /\b(kids|children|family|toddler)\b/],
];

function guessSegment(name: string, description?: string | null): string | null {
  const title = (name ?? "").toLowerCase();
  for (const [genre, re] of GENRE_RULES) if (re.test(title)) return genre;
  const desc = (description ?? "").toLowerCase();
  if (desc) for (const [genre, re] of GENRE_RULES) if (re.test(desc)) return genre;
  return null;
}

function normalize(e: any): EventItem {
  const dateStr: string | null = e?.start_time_utc ?? e?.start_time ?? null;
  const venue: string | null =
    e?.venue?.name ?? e?.venue?.full_address ?? e?.venue?.city ?? null;
  const ticket = Array.isArray(e?.ticket_links) ? e.ticket_links[0]?.link : null;
  const name: string = e?.name ?? "Untitled event";
  const vLat = Number(e?.venue?.latitude);
  const vLng = Number(e?.venue?.longitude);

  return {
    id: String(e?.event_id ?? e?.link ?? Math.random().toString(36).slice(2)),
    name,
    date: dateStr,
    dateLabel: fmtDate(dateStr),
    venue,
    segment: guessSegment(name, e?.description),
    priceLabel: null, // Google Events doesn't expose reliable pricing
    url: ticket ?? e?.link ?? null,
    image: e?.thumbnail ?? null,
    lat: Number.isFinite(vLat) && vLat !== 0 ? vLat : null,
    lng: Number.isFinite(vLng) && vLng !== 0 ? vLng : null,
  };
}

export async function GET() {
  const key = process.env.RAPIDAPI_KEY;

  if (!key) {
    const envelope: ApiEnvelope<EventsData> = {
      status: "sample",
      source: "Real-Time Events Search (RapidAPI)",
      fetchedAt: new Date().toISOString(),
      note: "Add RAPIDAPI_KEY in .env.local to see live Delhi events.",
      data: sampleEvents(),
    };
    return NextResponse.json(envelope);
  }

  try {
    const res = await fetchWithTimeout(EVENTS_URL, {
      timeoutMs: 9000,
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": RAPID_HOST,
      },
    });
    if (!res.ok) throw new Error(`Events API responded ${res.status}`);
    const json = await res.json();
    const raw: any[] = Array.isArray(json?.data) ? json.data : [];
    const events = raw
      .map(normalize)
      // Drop entries with no date and no name — the feed occasionally emits junk.
      .filter((e) => e.name && e.name !== "Untitled event")
      .slice(0, 24);

    const envelope: ApiEnvelope<EventsData> = {
      status: "live",
      source: "Real-Time Events Search (RapidAPI)",
      fetchedAt: new Date().toISOString(),
      note:
        events.length === 0 ? "No Delhi events returned right now." : undefined,
      data: { events, total: events.length },
    };
    return NextResponse.json(envelope);
  } catch (err) {
    const envelope: ApiEnvelope<EventsData> = {
      status: "error",
      source: "Real-Time Events Search (RapidAPI)",
      fetchedAt: new Date().toISOString(),
      note: err instanceof Error ? err.message : "Failed to fetch events.",
      data: { events: [], total: 0 },
    };
    return NextResponse.json(envelope, { status: 200 });
  }
}

function sampleEvents(): EventsData {
  const base = Date.now();
  const mk = (name: string, days: number, venue: string | null): EventItem => {
    const iso = new Date(base + days * 86400000).toISOString();
    return {
      id: name,
      name,
      date: iso,
      dateLabel: fmtDate(iso),
      venue,
      segment: guessSegment(name),
      priceLabel: null,
      url: null,
      image: null,
      lat: null,
      lng: null,
    };
  };
  return {
    events: [
      mk("Indie Night: Live Bands", 2, "The Piano Man, Safdarjung"),
      mk("Delhi Comedy Showcase", 4, "Kingdom of Dreams, Gurugram"),
      mk("Ranji Trophy Cricket Match", 6, "Arun Jaitley Stadium"),
      mk("Sufi Music Evening", 9, "India Habitat Centre"),
      mk("Contemporary Art Exhibition", 12, "Kiran Nadar Museum"),
    ],
    total: 5,
  };
}
