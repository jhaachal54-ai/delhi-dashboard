// route_id -> public bus number, generated from the OTD static GTFS routes.txt
// (route_long_name embeds the number + direction, e.g. "828AUP" -> "828A";
// each physical bus number has separate UP/DOWN route_ids in the feed).
import names from "@/data/busRouteNames.json";

const MAP = names as Record<string, string>;

// The number painted on the bus for a realtime route_id; null when unknown.
export function busNumber(routeId: string | null): string | null {
  if (!routeId) return null;
  return MAP[routeId] ?? null;
}
