import { readFileSync, writeFileSync } from "fs";

const dir = "gtfs/dmrc";
const out = "src/data/metroNetwork.json";

// Minimal CSV parse (no quoted commas in this dataset's fields we use).
const rows = (f) => readFileSync(`${dir}/${f}`, "utf8").trim().split(/\r?\n/).map(l => l.split(","));

// stops: id -> {name, lat, lng}
const [sh, ...srows] = rows("stops.txt");
const sid = sh.indexOf("stop_id"), snm = sh.indexOf("stop_name"), sla = sh.indexOf("stop_lat"), slo = sh.indexOf("stop_lon");
// DMRC renamed some stations after this GTFS snapshot was published.
const RENAME = { "Huda City Centre": "Millennium City Centre" };
const stopById = new Map(srows.map(r => {
  const nm = r[snm].trim();
  return [r[sid], { name: RENAME[nm] ?? nm, lat: +r[sla], lng: +r[slo] }];
}));

// routes: route_id -> line key
const keyOf = (long) => {
  const p = long.split("_")[0].trim().toUpperCase();
  if (p === "GRAY") return "grey";
  if (p === "ORANGE/AIRPORT") return "airport";
  return p.toLowerCase(); // red yellow blue green violet pink magenta aqua rapid
};
const [rh, ...rrows] = rows("routes.txt");
const rid = rh.indexOf("route_id"), rln = rh.indexOf("route_long_name");
const lineByRoute = new Map(rrows.map(r => [r[rid], keyOf(r[rln])]));

// trips: trip_id -> route_id
const [th, ...trows] = rows("trips.txt");
const tid = th.indexOf("trip_id"), trt = th.indexOf("route_id");
const routeByTrip = new Map(trows.map(r => [r[tid], r[trt]]));

// stop_times: trip -> ordered stops with times (for travel-second estimates)
const [qh, ...qrows] = rows("stop_times.txt");
const qt = qh.indexOf("trip_id"), qs = qh.indexOf("stop_id"), qq = qh.indexOf("stop_sequence");
const qa = qh.indexOf("arrival_time"), qd = qh.indexOf("departure_time");
const toSec = (hms) => {
  const [h, m, s] = (hms ?? "").split(":").map(Number);
  return Number.isFinite(h) ? h * 3600 + m * 60 + (s || 0) : null;
};
const byTrip = new Map();
for (const r of qrows) {
  const t = r[qt];
  if (!byTrip.has(t)) byTrip.set(t, []);
  byTrip.get(t).push([+r[qq], r[qs], toSec(r[qa]), toSec(r[qd])]);
}

// Dedup one pattern per unique stop-sequence per line, and accumulate
// inter-station travel seconds (departure at A -> arrival at B) per line edge.
const patternsByLine = new Map();
const edgeAcc = new Map(); // "line\tA\tB" -> {sum, n}
for (const [trip, seq] of byTrip) {
  const line = lineByRoute.get(routeByTrip.get(trip));
  if (!line) continue;
  seq.sort((a, b) => a[0] - b[0]);
  const names = seq.map(([, id]) => stopById.get(id)?.name).filter(Boolean);
  const sig = names.join("|");
  if (!patternsByLine.has(line)) patternsByLine.set(line, new Map());
  patternsByLine.get(line).set(sig, names);
  for (let i = 0; i < seq.length - 1; i++) {
    const a = stopById.get(seq[i][1])?.name;
    const b = stopById.get(seq[i + 1][1])?.name;
    const dep = seq[i][3], arr = seq[i + 1][2];
    if (!a || !b || dep == null || arr == null || arr <= dep) continue;
    const k = `${line}\t${a}\t${b}`;
    const acc = edgeAcc.get(k) ?? { sum: 0, n: 0 };
    acc.sum += arr - dep;
    acc.n += 1;
    edgeAcc.set(k, acc);
  }
}

// First/last train per line: earliest first-departure and latest last-arrival
// across all trips of that line.
const service = {};
for (const [trip, seq] of byTrip) {
  const line = lineByRoute.get(routeByTrip.get(trip));
  if (!line) continue;
  seq.sort((a, b) => a[0] - b[0]);
  const firstDep = seq[0][3];
  const lastArr = seq[seq.length - 1][2];
  if (firstDep == null || lastArr == null) continue;
  const cur = service[line] ?? { first: Infinity, last: -Infinity };
  cur.first = Math.min(cur.first, firstDep);
  cur.last = Math.max(cur.last, lastArr);
  service[line] = cur;
}
const hhmm = (sec) => {
  const h = Math.floor(sec / 3600) % 24, m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
for (const k of Object.keys(service)) {
  service[k] = { first: hhmm(service[k].first), last: hhmm(service[k].last) };
}

// times[line][A][B] = average seconds A->B
const times = {};
for (const [k, { sum, n }] of edgeAcc) {
  const [line, a, b] = k.split("\t");
  times[line] ??= {};
  times[line][a] ??= {};
  times[line][a][b] = Math.round(sum / n);
}

const lines = {};
const stations = {};
for (const [line, pats] of patternsByLine) {
  lines[line] = { patterns: [...pats.values()] };
  for (const pat of pats.values()) {
    for (const name of pat) {
      if (!stations[name]) {
        const s = [...stopById.values()].find(v => v.name === name);
        stations[name] = { lines: [], lat: s?.lat ?? null, lng: s?.lng ?? null };
      }
      if (!stations[name].lines.includes(line)) stations[name].lines.push(line);
    }
  }
}

writeFileSync(out, JSON.stringify({ lines, stations, times, service }));
console.log("service:", JSON.stringify(service));
const nEdges = Object.values(times).reduce((s, l) => s + Object.values(l).reduce((x, m) => x + Object.keys(m).length, 0), 0);
console.log("timed edges:", nEdges);
console.log("sample yellow leg (Rajiv Chowk ->):", JSON.stringify(times.yellow?.["Rajiv Chowk"]));
console.log("lines:", Object.keys(lines).join(", "));
console.log("stations:", Object.keys(stations).length);
console.log("patterns per line:", Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, v.patterns.length])));
// Check the tourist-place station names used in places.ts
const need = ["Central Secretariat","Lal Quila","Jama Masjid","Chandni Chowk","Qutub Minar","Hazrat Nizamuddin","Kalkaji Mandir","Akshardham","Rajiv Chowk","Hauz Khas","Jor Bagh","INA","Delhi Gate","Supreme Court"];
const all = Object.keys(stations);
for (const n of need) {
  if (!stations[n]) {
    const guess = all.filter(a => a.toLowerCase().includes(n.split(" ")[0].toLowerCase().slice(0,5)));
    console.log("MISSING:", JSON.stringify(n), "→ candidates:", JSON.stringify(guess));
  }
}
