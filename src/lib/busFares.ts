// Painted bus number -> [min, max] fare in INR, extracted from the OTD static
// GTFS fare_attributes.txt (distance-slab fares per route).
import fares from "@/data/busFares.json";

const MAP = fares as unknown as Record<string, [number, number]>;

export function busFare(busNumber: string): [number, number] | null {
  return MAP[busNumber] ?? null;
}
