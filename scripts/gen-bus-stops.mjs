// All DTC/DIMTS bus stops (name + coords) from the bus GTFS stops.txt.
// Run from the project root: node scripts/gen-bus-stops.mjs
import { readFileSync, writeFileSync } from "fs";

const GTFS = process.env.BUS_GTFS_DIR ?? `${process.env.USERPROFILE ?? process.env.HOME}/Downloads/GTFS`;
const src = `${GTFS}/stops.txt`;
const out = "src/data/busStops.json";

const lines = readFileSync(src, "utf8").trim().split(/\r?\n/);
const header = lines[0].split(",");
const nameIdx = header.indexOf("stop_name");
const latIdx = header.indexOf("stop_lat");
const lngIdx = header.indexOf("stop_lon");

const stops = [];
for (const line of lines.slice(1)) {
  const c = line.split(",");
  const name = c[nameIdx]?.trim();
  const lat = Number(c[latIdx]);
  const lng = Number(c[lngIdx]);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0) continue;
  stops.push([name, Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5]);
}
writeFileSync(out, JSON.stringify(stops));
console.log("bus stops:", stops.length);
