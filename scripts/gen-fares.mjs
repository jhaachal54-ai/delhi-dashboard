// Stream the 130MB bus GTFS fare_attributes.txt -> min/max fare per painted
// bus number. fare_id format: AGENCY_ROUTEID_ORIGIN_DEST, price in INR.
import { createReadStream, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";

const GTFS = process.env.BUS_GTFS_DIR ?? `${process.env.USERPROFILE ?? process.env.HOME}/Downloads/GTFS`;
const src = `${GTFS}/fare_attributes.txt`;
const namesPath = "src/data/busRouteNames.json";
const out = "src/data/busFares.json";

const names = JSON.parse(readFileSync(namesPath, "utf8"));
const byRoute = new Map(); // route_id -> {min,max}

const rl = createInterface({ input: createReadStream(src), crlfDelay: Infinity });
let header = true, rows = 0, skipped = 0;
rl.on("line", (line) => {
  if (header) { header = false; return; }
  rows++;
  const c1 = line.indexOf(","), c2 = line.indexOf(",", c1 + 1);
  if (c1 < 0 || c2 < 0) { skipped++; return; }
  const fareId = line.slice(0, c1);
  const price = Number(line.slice(c1 + 1, c2));
  if (!Number.isFinite(price)) { skipped++; return; }
  const parts = fareId.split("_");
  if (parts.length < 2) { skipped++; return; }
  const routeId = parts[1];
  const cur = byRoute.get(routeId);
  if (!cur) byRoute.set(routeId, { min: price, max: price });
  else { if (price < cur.min) cur.min = price; if (price > cur.max) cur.max = price; }
});
rl.on("close", () => {
  // Aggregate per painted bus number (route_ids merge across directions).
  const byNumber = {};
  for (const [routeId, f] of byRoute) {
    const num = names[routeId] ?? null;
    if (!num) continue;
    const cur = byNumber[num];
    if (!cur) byNumber[num] = [f.min, f.max];
    else { cur[0] = Math.min(cur[0], f.min); cur[1] = Math.max(cur[1], f.max); }
  }
  writeFileSync(out, JSON.stringify(byNumber));
  console.log("rows:", rows, "skipped:", skipped);
  console.log("route_ids with fares:", byRoute.size, "-> bus numbers:", Object.keys(byNumber).length);
  console.log("samples:", JSON.stringify(Object.entries(byNumber).slice(0, 5)));
});
