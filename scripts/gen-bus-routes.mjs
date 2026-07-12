// Route path (ordered stop coordinates) for every painted bus number, from the
// bus GTFS. Two streaming passes over the 138MB stop_times.txt:
//   pass 1 — count stops per trip, pick the longest trip per painted number
//   pass 2 — collect the stop sequences of only those chosen trips
// Run from the project root: node scripts/gen-bus-routes.mjs
import { createReadStream, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";

const GTFS = "C:/Users/USER/Downloads/GTFS";
const names = JSON.parse(readFileSync("src/data/busRouteNames.json", "utf8"));
const out = "src/data/busRoutePaths.json";

// stops: id -> [lat, lng]
const stopRows = readFileSync(`${GTFS}/stops.txt`, "utf8").trim().split(/\r?\n/);
const sh = stopRows[0].split(",");
const sid = sh.indexOf("stop_id"), sla = sh.indexOf("stop_lat"), slo = sh.indexOf("stop_lon");
const stopCoord = new Map();
for (const r of stopRows.slice(1)) {
  const c = r.split(",");
  const lat = Number(c[sla]), lng = Number(c[slo]);
  if (Number.isFinite(lat) && lat !== 0) {
    stopCoord.set(c[sid], [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5]);
  }
}

// trips: trip_id -> painted number (via route_id)
const tripRows = readFileSync(`${GTFS}/trips.txt`, "utf8").trim().split(/\r?\n/);
const th = tripRows[0].split(",");
const tt = th.indexOf("trip_id"), tr = th.indexOf("route_id");
const numByTrip = new Map();
for (const r of tripRows.slice(1)) {
  const c = r.split(",");
  const num = names[c[tr]];
  if (num) numByTrip.set(c[tt], num);
}

const stream = () =>
  createInterface({ input: createReadStream(`${GTFS}/stop_times.txt`), crlfDelay: Infinity });

// pass 1: stops per trip -> longest trip per number
const countByTrip = new Map();
await new Promise((resolve) => {
  let header = true;
  const rl = stream();
  rl.on("line", (line) => {
    if (header) { header = false; return; }
    const trip = line.slice(0, line.indexOf(","));
    if (!numByTrip.has(trip)) return;
    countByTrip.set(trip, (countByTrip.get(trip) ?? 0) + 1);
  });
  rl.on("close", resolve);
});
const bestTripByNum = new Map(); // number -> [trip, count]
for (const [trip, n] of countByTrip) {
  const num = numByTrip.get(trip);
  const cur = bestTripByNum.get(num);
  if (!cur || n > cur[1]) bestTripByNum.set(num, [trip, n]);
}
const wanted = new Set([...bestTripByNum.values()].map(([t]) => t));
console.log("pass 1 done: trips counted", countByTrip.size, "| chosen", wanted.size);

// pass 2: sequences for chosen trips only
const seqByTrip = new Map();
await new Promise((resolve) => {
  let header = true;
  const rl = stream();
  rl.on("line", (line) => {
    if (header) { header = false; return; }
    const c1 = line.indexOf(",");
    const trip = line.slice(0, c1);
    if (!wanted.has(trip)) return;
    const cols = line.split(",");
    const stopId = cols[3];
    const seq = Number(cols[4]);
    if (!seqByTrip.has(trip)) seqByTrip.set(trip, []);
    seqByTrip.get(trip).push([seq, stopId]);
  });
  rl.on("close", resolve);
});

const paths = {};
for (const [num, [trip]] of bestTripByNum) {
  const seq = seqByTrip.get(trip);
  if (!seq) continue;
  seq.sort((a, b) => a[0] - b[0]);
  const coords = seq.map(([, id]) => stopCoord.get(id)).filter(Boolean);
  if (coords.length >= 2) paths[num] = coords;
}
writeFileSync(out, JSON.stringify(paths));
const size = JSON.stringify(paths).length;
console.log("routes with paths:", Object.keys(paths).length, `(${Math.round(size / 1024)} KB)`);
