import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/http";
import { readFresh, readStale, write } from "@/lib/serverCache";
import type { ApiEnvelope, RatesData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// open.er-api.com — free, no key. Rates barely move, so cache 12h.
const CACHE_TTL_MS = 12 * 3600_000;

export async function GET() {
  const cached = readFresh<RatesData>("rates", CACHE_TTL_MS);
  if (cached) return NextResponse.json(cached);
  try {
    const res = await fetchWithTimeout("https://open.er-api.com/v6/latest/USD", { timeoutMs: 8000 });
    if (!res.ok) throw new Error(`rates responded ${res.status}`);
    const j = await res.json();
    const r = j?.rates ?? {};
    const inr = Number(r.INR);
    if (!Number.isFinite(inr)) throw new Error("no INR rate");
    const data: RatesData = {
      base: "INR",
      perUsd: Math.round(inr * 100) / 100,
      perEur: r.EUR ? Math.round((inr / r.EUR) * 100) / 100 : null,
      perGbp: r.GBP ? Math.round((inr / r.GBP) * 100) / 100 : null,
    };
    const envelope: ApiEnvelope<RatesData> = {
      status: "live",
      source: "open.er-api.com",
      fetchedAt: new Date().toISOString(),
      data,
    };
    write("rates", envelope);
    return NextResponse.json(envelope);
  } catch {
    const stale = readStale<RatesData>("rates");
    if (stale) return NextResponse.json(stale);
    return NextResponse.json({
      status: "error",
      source: "open.er-api.com",
      fetchedAt: new Date().toISOString(),
      note: "Couldn't fetch exchange rates right now.",
      data: { base: "INR", perUsd: null, perEur: null, perGbp: null },
    } satisfies ApiEnvelope<RatesData>);
  }
}
