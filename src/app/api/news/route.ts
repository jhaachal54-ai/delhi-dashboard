import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/http";
import { readFresh, readStale, write } from "@/lib/serverCache";
import type { ApiEnvelope, NewsData, NewsItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache headlines for 3h — well under GNews's 100 req/day free tier.
const CACHE_TTL_MS = 3 * 60 * 60_000;

// GNews free tier (100 req/day). Set GNEWS_KEY in .env.local. Falls back to a
// clearly-labelled sample strip when no key is configured or the quota is spent.
export async function GET() {
  const cached = readFresh<NewsData>("news", CACHE_TTL_MS);
  if (cached) return NextResponse.json(cached);
  const envelope = await build();
  write("news", envelope);
  return NextResponse.json(envelope);
}

async function build(): Promise<ApiEnvelope<NewsData>> {
  const key = process.env.GNEWS_KEY;
  if (key) {
    try {
      const url =
        "https://gnews.io/api/v4/search?" +
        new URLSearchParams({
          q: "Delhi",
          lang: "en",
          country: "in",
          max: "8",
          apikey: key,
        }).toString();
      const res = await fetchWithTimeout(url, { timeoutMs: 9000 });
      if (!res.ok) throw new Error(`GNews responded ${res.status}`);
      const j = await res.json();
      const items: NewsItem[] = (Array.isArray(j?.articles) ? j.articles : [])
        .slice(0, 8)
        .map((a: any) => ({
          title: a?.title ?? "—",
          source: a?.source?.name ?? "News",
          url: a?.url ?? null,
          publishedAt: a?.publishedAt ?? null,
          image: a?.image ?? null,
        }));
      if (items.length === 0) throw new Error("no articles");
      return {
        status: "live",
        source: "GNews · Delhi headlines",
        fetchedAt: new Date().toISOString(),
        data: { items },
      };
    } catch {
      /* fall through to last-good or sample */
    }
  }
  const stale = readStale<NewsData>("news");
  if (stale && stale.status === "live") {
    return { ...stale, note: "Showing the last live headlines — upstream is unavailable right now." };
  }
  return {
    status: "sample",
    source: "GNews · Delhi headlines",
    fetchedAt: new Date().toISOString(),
    note: "Add a free GNEWS_KEY in .env.local to see live Delhi headlines — showing sample items.",
    data: sampleNews(),
  };
}

function sampleNews(): NewsData {
  return {
    items: [
      { title: "Delhi Metro extends Airport Express to Yashobhoomi", source: "Sample", url: null, publishedAt: null, image: null },
      { title: "AQI dips to 'very poor' as dust sweeps the NCR", source: "Sample", url: null, publishedAt: null, image: null },
      { title: "DTC adds electric buses on six busy corridors", source: "Sample", url: null, publishedAt: null, image: null },
      { title: "Weekend cultural fest opens at Bharat Mandapam", source: "Sample", url: null, publishedAt: null, image: null },
    ],
  };
}
