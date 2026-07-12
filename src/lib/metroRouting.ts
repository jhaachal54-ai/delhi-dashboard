// Delhi Metro journey planning over the full DMRC network, generated from the
// official DMRC GTFS (src/data/metroNetwork.json — all 262 stations, with the
// ordered stop sequence of every service pattern per line). Routing runs
// station-by-station (Dijkstra with a transfer penalty), so it gives the real
// line, interchange, direction ("towards X" as on platform signage) and stop
// counts — branches like Blue→Vaishali are handled by the pattern data.

import network from "@/data/metroNetwork.json";
import { haversineKm } from "./geo";
import { METRO_LINES, type MetroLine } from "./metro";

interface NetStation {
  lines: string[];
  lat: number | null;
  lng: number | null;
}

const NET = network as {
  lines: Record<string, { patterns: string[][] }>;
  stations: Record<string, NetStation>;
  // times[line][A][B] = average scheduled seconds A->B (from GTFS stop_times)
  times: Record<string, Record<string, Record<string, number>>>;
  // service[line] = first/last train of the day ("05:20" / "01:13")
  service: Record<string, { first: string; last: string }>;
};

export const LINE_PATTERNS: Record<string, string[][]> = Object.fromEntries(
  Object.entries(NET.lines).map(([k, v]) => [k, v.patterns])
);

export const SERVICE_HOURS: Record<string, { first: string; last: string }> = NET.service ?? {};

export const STATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(NET.stations).map(([name, s]) => [name, s.lines])
);

export const STATION_NAMES = Object.keys(NET.stations).sort((a, b) => a.localeCompare(b));

// Station coordinates from the GTFS, for maps and nearest-station lookup.
export const STATION_COORDS: { name: string; lat: number; lng: number; lines: string[] }[] =
  Object.entries(NET.stations)
    .filter(([, s]) => s.lat != null && s.lng != null)
    .map(([name, s]) => ({ name, lat: s.lat!, lng: s.lng!, lines: s.lines }));

export function nearestStation(lat: number, lng: number): { name: string; km: number } | null {
  let best: { name: string; km: number } | null = null;
  for (const s of STATION_COORDS) {
    const km = haversineKm(lat, lng, s.lat, s.lng);
    if (!best || km < best.km) best = { name: s.name, km };
  }
  return best;
}

const LINE_BY_KEY = new Map(METRO_LINES.map((l) => [l.key, l]));

// Station graph: consecutive stops of every pattern become bidirectional edges
// labelled with their line.
const EDGES = new Map<string, { to: string; line: string }[]>();
function addEdge(a: string, b: string, line: string) {
  const arr = EDGES.get(a) ?? [];
  if (!arr.some((e) => e.to === b && e.line === line)) arr.push({ to: b, line });
  EDGES.set(a, arr);
}
for (const [line, { patterns }] of Object.entries(NET.lines)) {
  for (const pat of patterns) {
    for (let i = 0; i < pat.length - 1; i++) {
      addEdge(pat[i], pat[i + 1], line);
      addEdge(pat[i + 1], pat[i], line);
    }
  }
}

// Physical interchange walkways between separately-named stations — without
// these the Aqua line (and the Airport↔Pink transfer) would be unreachable.
const WALKWAYS: [string, string][] = [
  ["Noida Sector 51", "Noida Sec-52"],
  ["Dhaula Kuan", "Durgabai Deshmukh South Campus"],
];
for (const [a, b] of WALKWAYS) {
  if (NET.stations[a] && NET.stations[b]) {
    addEdge(a, b, "walk");
    addEdge(b, a, "walk");
  }
}

// Pseudo-line so walkway hops render like any other segment.
const WALK_LINE: MetroLine = {
  key: "walk",
  name: "Walk",
  color: "#8b93a8",
  dark: false,
  from: "",
  to: "",
  stations: 0,
  open: 0,
  close: 1440,
};

export interface MetroSeg {
  line: MetroLine;
  board: string;
  alight: string;
  stops: number; // stations ridden on this segment
  minutes: number; // scheduled ride time for this segment (walk time for walkways)
  km: number; // track distance estimate (straight-line between consecutive stops)
  towards: string | null; // terminus shown on platform signage for this direction
}

// Straight-line km between two adjacent stations (close enough for fare slabs).
function hopKm(from: string, to: string): number {
  const a = NET.stations[from];
  const b = NET.stations[to];
  if (!a || !b || a.lat == null || b.lat == null) return 1.2;
  return haversineKm(a.lat, a.lng!, b.lat, b.lng!);
}

// Scheduled travel seconds for one hop; falls back to a typical 2-minute leg
// for the rare edge missing from stop_times.
const WALK_SECONDS = 420; // interchange walkways (Sec 51↔52, Dhaula Kuan) are long
function hopSeconds(line: string, from: string, to: string): number {
  if (line === "walk") return WALK_SECONDS;
  return NET.times[line]?.[from]?.[to] ?? NET.times[line]?.[to]?.[from] ?? 120;
}

// Extra cost for changing lines, in seconds — platform change + wait for the
// next train. Steers routes away from pointless interchanges.
const TRANSFER_COST = 300;
// State separator for "station + line" keys — never occurs in a station name.
const SEP = String.fromCharCode(0);

// Which terminus the train is heading to: find a service pattern of this line
// that passes board before alight; its final stop is the signage direction.
function findTowards(lineKey: string, board: string, alight: string): string | null {
  for (const pat of NET.lines[lineKey]?.patterns ?? []) {
    const bi = pat.indexOf(board);
    const ai = pat.indexOf(alight);
    if (bi !== -1 && ai !== -1 && bi < ai) return pat[pat.length - 1];
  }
  return null;
}

function mkSeg(
  lineKey: string,
  board: string,
  alight: string,
  stops: number,
  seconds: number,
  km: number
): MetroSeg {
  return {
    line: LINE_BY_KEY.get(lineKey) ?? WALK_LINE,
    board,
    alight,
    stops,
    minutes: Math.max(1, Math.round(seconds / 60)),
    km,
    towards: lineKey === "walk" ? null : findTowards(lineKey, board, alight),
  };
}

// Plan a journey between two stations. Returns [] if already there,
// null if either station is unknown or no path exists.
export function planMetroRoute(from: string, to: string): MetroSeg[] | null {
  if (!NET.stations[from] || !NET.stations[to]) return null;
  if (from === to) return [];

  // Dijkstra over (station, line) states so transfers can be penalised.
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const pq: [number, string][] = [];
  const push = (d: number, s: string, p: string | null) => {
    const cur = dist.get(s);
    if (cur != null && cur <= d) return;
    dist.set(s, d);
    prev.set(s, p);
    pq.push([d, s]);
  };

  for (const l of NET.stations[from].lines) push(0, `${from}${SEP}${l}`, null);

  let goal: string | null = null;
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, s] = pq.shift()!;
    if ((dist.get(s) ?? Infinity) < d) continue;
    const [st, ln] = s.split(SEP);
    if (st === to) {
      goal = s;
      break;
    }
    for (const e of EDGES.get(st) ?? []) {
      const ride = hopSeconds(e.line, st, e.to);
      const cost = e.line === ln ? ride : ride + TRANSFER_COST;
      push(d + cost, `${e.to}${SEP}${e.line}`, s);
    }
  }
  if (!goal) return null;

  // Reconstruct the (station, line) path.
  const path: [string, string][] = [];
  for (let s: string | null = goal; s != null; s = prev.get(s) ?? null) {
    const [st, ln] = s.split(SEP);
    path.unshift([st, ln]);
  }

  // Compress into per-line segments. Each hop is ridden on the line of its
  // destination entry; a line change means an interchange at the previous stop.
  const segs: MetroSeg[] = [];
  let board = path[0][0];
  let curLine = path[1][1];
  let stops = 0;
  let seconds = 0;
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    const [st, ln] = path[i];
    if (ln !== curLine) {
      segs.push(mkSeg(curLine, board, path[i - 1][0], stops, seconds, km));
      board = path[i - 1][0];
      curLine = ln;
      stops = 0;
      seconds = 0;
      km = 0;
    }
    stops++;
    seconds += hopSeconds(ln, path[i - 1][0], st);
    km += hopKm(path[i - 1][0], st);
    if (i === path.length - 1) segs.push(mkSeg(curLine, board, st, stops, seconds, km));
  }
  return segs;
}

// Door-to-door estimate: ride time + a ~4-minute allowance per interchange
// (platform change + waiting for the next train).
export function totalJourneyMinutes(segs: MetroSeg[]): number {
  const rides = segs.filter((s) => s.line.key !== "walk").length;
  const ride = segs.reduce((sum, s) => sum + s.minutes, 0);
  return ride + Math.max(0, rides - 1) * 4;
}

// DMRC distance-slab fares (standard chart; Airport Express is premium-priced
// separately, so we flag it instead of guessing).
const FARE_SLABS: [number, number][] = [
  [2, 10],
  [5, 20],
  [12, 30],
  [21, 40],
  [32, 50],
  [Infinity, 60],
];

// Every station passed on a journey (for highlighting the route on the map):
// for each segment, slice the service pattern between board and alight.
export function routeStations(segs: MetroSeg[]): string[] {
  const out: string[] = [];
  for (const seg of segs) {
    if (seg.line.key === "walk") {
      if (out[out.length - 1] !== seg.board) out.push(seg.board);
      out.push(seg.alight);
      continue;
    }
    let sliced: string[] | null = null;
    for (const pat of NET.lines[seg.line.key]?.patterns ?? []) {
      const bi = pat.indexOf(seg.board);
      const ai = pat.indexOf(seg.alight);
      if (bi !== -1 && ai !== -1 && bi < ai) {
        sliced = pat.slice(bi, ai + 1);
        break;
      }
    }
    for (const s of sliced ?? [seg.board, seg.alight]) {
      if (out[out.length - 1] !== s) out.push(s);
    }
  }
  return out;
}

export function journeyFareEstimate(segs: MetroSeg[]): {
  fare: number;
  km: number;
  airportPremium: boolean;
} {
  const km = segs.filter((s) => s.line.key !== "walk").reduce((sum, s) => sum + s.km, 0);
  const fare = FARE_SLABS.find(([max]) => km <= max)?.[1] ?? 60;
  return {
    fare,
    km,
    airportPremium: segs.some((s) => s.line.key === "airport"),
  };
}
