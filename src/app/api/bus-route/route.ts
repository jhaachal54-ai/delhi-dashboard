import { NextResponse } from "next/server";
import paths from "@/data/busRoutePaths.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATHS = paths as unknown as Record<string, [number, number][]>;

// Ordered stop coordinates for a painted bus number, extracted from the
// static GTFS (longest scheduled trip of that route).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const route = searchParams.get("route") ?? "";
  const path = PATHS[route];
  if (!path) {
    return NextResponse.json({ route, path: null }, { status: 200 });
  }
  return NextResponse.json({ route, path });
}
