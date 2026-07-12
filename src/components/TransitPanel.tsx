"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import boundary from "@/data/delhiBoundary.json";
import { busFare } from "@/lib/busFares";
import { CITY } from "@/lib/config";
import { useFeeds } from "@/lib/feeds";
import { haversineKm } from "@/lib/geo";
import { METRO_LINES } from "@/lib/metro";
import { LINE_PATTERNS, nearestStation, STATION_COORDS } from "@/lib/metroRouting";
import { AnimatedNumber } from "./AnimatedNumber";
import { Panel } from "./Panel";

const W = 700;
const H = 500;

function project(lat: number, lng: number): { x: number; y: number } {
  const b = CITY.bbox;
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * W;
  // latitude increases upward, but SVG y increases downward
  const y = (1 - (lat - b.minLat) / (b.maxLat - b.minLat)) * H;
  return { x, y };
}

// Inverse of project(): map SVG coords back to lat/lng for click handling.
function unproject(x: number, y: number): { lat: number; lng: number } {
  const b = CITY.bbox;
  return {
    lng: b.minLng + (x / W) * (b.maxLng - b.minLng),
    lat: b.maxLat - (y / H) * (b.maxLat - b.minLat),
  };
}

const LINE_COLOR = new Map(METRO_LINES.map((l) => [l.key, l.color]));

function fmtIst(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function TransitPanel() {
  const { data, loading, error } = useFeeds().transit;
  const env = data;
  const d = env?.data;
  const plotted = (d?.buses ?? []).filter((b) => !b.suspect);
  // Dense (live) feed vs. a handful of sample buses — tune the marker styling.
  const dense = plotted.length > 60;
  const dotR = dense ? 2.4 : 4.5;

  // Selected bus route (click a dot) — highlights every bus on that route.
  const [selRoute, setSelRoute] = useState<string | null>(null);
  // Full scheduled path of the selected route (from static GTFS via API).
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  useEffect(() => {
    if (!selRoute) {
      setRoutePath(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/bus-route?route=${encodeURIComponent(selRoute)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setRoutePath(j.path ?? null);
      })
      .catch(() => {
        if (!cancelled) setRoutePath(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selRoute]);
  // Dropped pin (click empty map) — shows the nearest metro station.
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const pinNearest = pin ? nearestStation(pin.lat, pin.lng) : null;
  const pinStation = pinNearest
    ? STATION_COORDS.find((s) => s.name === pinNearest.name) ?? null
    : null;
  const selBuses = selRoute ? plotted.filter((b) => b.routeId === selRoute) : [];
  const selLastSeen = selBuses.reduce<number | null>(
    (max, b) => (b.timestamp != null && (max == null || b.timestamp > max) ? b.timestamp : max),
    null
  );
  const selFare = selRoute ? busFare(selRoute) : null;

  // Delhi (NCT) boundary outline, projected once.
  const boundaryPath = useMemo(() => {
    const pts = (boundary as [number, number][]).map(([lng, lat]) => project(lat, lng));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  }, []);

  // Faint metro network under the buses, for orientation.
  const metroPaths = useMemo(() => {
    const coord = new Map(STATION_COORDS.map((s) => [s.name, s]));
    const out: { key: string; d: string; color: string }[] = [];
    for (const [line, patterns] of Object.entries(LINE_PATTERNS)) {
      patterns.forEach((pat, pi) => {
        const pts = pat
          .map((n) => coord.get(n))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map((s) => project(s.lat, s.lng));
        if (pts.length < 2) return;
        out.push({
          key: `${line}-${pi}`,
          d: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
          color: LINE_COLOR.get(line) ?? "#888",
        });
      });
    }
    return out;
  }, []);

  // Remember each bus's previous plotted position so we can draw a short
  // fading trail showing its direction of travel between refreshes.
  const prevPos = useRef(new Map<string, { x: number; y: number }>());
  useEffect(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const b of plotted) m.set(b.id, project(b.lat, b.lng));
    prevPos.current = m;
  }, [env]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel
      title="Live Buses"
      icon="🚌"
      source={env?.source ?? "Delhi Open Transit Data"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {loading && !env && <div className="skeleton sk-block" />}
      {env?.note && <div className="note">{env.note}</div>}
      {error && !env && <div className="note">Could not reach the dashboard API: {error}</div>}

      <div className="map">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Map of live bus positions across Delhi"
          onClick={(e) => {
            // Background click: clear any route selection, or drop a pin that
            // points to the nearest metro station.
            if (selRoute) {
              setSelRoute(null);
              return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * W;
            const y = ((e.clientY - rect.top) / rect.height) * H;
            setPin(unproject(x, y));
          }}
        >
          {/* Delhi NCT boundary */}
          <path
            d={boundaryPath}
            fill="rgba(110,168,254,0.045)"
            stroke="rgba(110,168,254,0.35)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {/* metro network underlay for orientation */}
          {metroPaths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={1.3}
              opacity={0.22}
              strokeLinecap="round"
            />
          ))}

          {/* city centre + rotating radar sweep */}
          {(() => {
            const c = project(CITY.lat, CITY.lng);
            return (
              <g style={{ transform: `translate(${c.x}px, ${c.y}px)` }}>
                <defs>
                  <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6ea8fe" stopOpacity="0" />
                    <stop offset="100%" stopColor="#6ea8fe" stopOpacity="0.28" />
                  </linearGradient>
                </defs>
                <circle r={140} fill="none" stroke="rgba(110,168,254,0.10)" />
                <circle r={80} fill="none" stroke="rgba(110,168,254,0.08)" />
                <path className="radar" d="M0,0 L150,-42 A156,156 0 0,1 150,42 Z" fill="url(#sweepGrad)" />
                <circle r={4} fill="#6ea8fe" opacity={0.7} />
              </g>
            );
          })()}

          {/* full scheduled path of the selected route, with its stops */}
          {routePath && (() => {
            const pts = routePath.map(([lat, lng]) => project(lat, lng));
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(" ");
            return (
              <g className="route-path">
                <path d={d} fill="none" stroke="#ffffff" strokeWidth={3.4} opacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="#7ce0c3" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="route-path-line" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={1.7} fill="#eafff7" opacity={0.85} />
                ))}
              </g>
            );
          })()}

          {/* direction trails: previous position -> current */}
          {plotted.map((b) => {
            const prev = prevPos.current.get(b.id);
            if (!prev) return null;
            const cur = project(b.lat, b.lng);
            const dist = Math.hypot(cur.x - prev.x, cur.y - prev.y);
            if (dist < 0.8 || dist > 60) return null; // idle or GPS teleport
            return (
              <line
                key={`t${b.id}`}
                x1={prev.x}
                y1={prev.y}
                x2={cur.x}
                y2={cur.y}
                stroke={b.stale ? "#fbbf24" : "#7ce0c3"}
                strokeWidth={1.6}
                strokeLinecap="round"
                className="bus-trail"
              />
            );
          })}

          {plotted.map((b) => {
            const { x, y } = project(b.lat, b.lng);
            const color = b.stale ? "#fbbf24" : "#7ce0c3";
            const isSel = selRoute != null && b.routeId === selRoute;
            const dimmed = selRoute != null && !isSel;
            return (
              <g
                key={b.id}
                className="bus"
                style={{ transform: `translate(${x}px, ${y}px)`, color }}
              >
                {!dense && !b.stale && <circle className="bus-pulse" r={4} fill={color} />}
                <circle
                  className={`bus-hit ${dense ? "" : "bus-dot"}`}
                  r={isSel ? dotR + 2.2 : dotR}
                  fill={isSel ? "#ffffff" : color}
                  stroke={isSel ? color : "none"}
                  strokeWidth={isSel ? 2 : 0}
                  opacity={dimmed ? 0.18 : dense ? 0.85 : 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (b.routeId) setSelRoute(selRoute === b.routeId ? null : b.routeId);
                  }}
                >
                  <title>
                    {b.routeId ? `Bus ${b.routeId} — click for details` : "Unknown route"}
                    {b.stale ? " · stale fix" : " · live"}
                  </title>
                </circle>
              </g>
            );
          })}

          {/* dropped pin -> nearest metro station */}
          {pin && pinNearest && pinStation && (() => {
            const p = project(pin.lat, pin.lng);
            const s = project(pinStation.lat, pinStation.lng);
            const km = haversineKm(pin.lat, pin.lng, pinStation.lat, pinStation.lng);
            const midX = (p.x + s.x) / 2;
            const midY = (p.y + s.y) / 2 - 8;
            return (
              <g className="map-pin" onClick={(e) => { e.stopPropagation(); setPin(null); }}>
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={s.x}
                  y2={s.y}
                  stroke="#b98cff"
                  strokeWidth={1.8}
                  strokeDasharray="5 4"
                />
                <circle cx={s.x} cy={s.y} r={6} fill="none" stroke="#b98cff" strokeWidth={2} />
                <circle cx={p.x} cy={p.y} r={5} fill="#b98cff" />
                <circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#b98cff" opacity={0.5}>
                  <animate attributeName="r" values="6;14" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <text x={midX} y={midY} textAnchor="middle" className="map-pin-label">
                  {pinNearest.name} · {km.toFixed(1)} km
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {selRoute && (
        <div className="bus-info">
          <div className="bus-info-head">
            <span className="bus-no">{selRoute}</span>
            <span className="bus-info-title">Route details</span>
            <button className="bus-info-close" onClick={() => setSelRoute(null)}>
              ✕ clear
            </button>
          </div>
          <div className="bus-info-grid">
            <div>
              <b>{selBuses.length}</b> buses live on this route now
            </div>
            <div>
              <b>{routePath ? routePath.length : "—"}</b> stops on the full route
            </div>
            <div>
              <b>{selFare ? `₹${selFare[0]}–${selFare[1]}` : "n/a"}</b> fare (distance slab)
            </div>
            <div>
              <b>{fmtIst(selLastSeen)}</b> freshest GPS fix
            </div>
            <div>
              <b>~05:30–23:00</b> typical DTC hours
            </div>
          </div>
          <div className="hint">
            Highlighted dots are every live bus on route {selRoute}. Route-level timetables
            aren&apos;t published in the open feed.
          </div>
        </div>
      )}

      <div className="legend">
        <span>
          <i style={{ background: "#7ce0c3", color: "#7ce0c3" }} /> live fix
        </span>
        <span>
          <i style={{ background: "#fbbf24", color: "#fbbf24" }} /> stale &gt;2min
        </span>
        <span style={{ color: "var(--text-faint)" }}>
          · click a bus for route details · click empty map for your nearest metro
        </span>
        {d && d.plotted < d.stats.total && (
          <span style={{ color: "var(--text-faint)" }}>
            showing {d.plotted.toLocaleString("en-IN")} of{" "}
            {d.stats.total.toLocaleString("en-IN")}
          </span>
        )}
      </div>

      {d && (
        <div className="stats">
          <div className="stat">
            <div className="v"><AnimatedNumber value={d.stats.total} /></div>
            <div className="l">buses tracked</div>
          </div>
          <div className="stat">
            <div className="v"><AnimatedNumber value={d.stats.routes} /></div>
            <div className="l">active routes</div>
          </div>
          <div className="stat good">
            <div className="v"><AnimatedNumber value={d.stats.fresh} /></div>
            <div className="l">live &lt;2min</div>
          </div>
          <div className={`stat ${d.stats.stale ? "warn" : ""}`}>
            <div className="v"><AnimatedNumber value={d.stats.stale} /></div>
            <div className="l">stale &gt;2min</div>
          </div>
          <div className={`stat ${d.stats.suspectCoords ? "bad" : ""}`}>
            <div className="v"><AnimatedNumber value={d.stats.suspectCoords} /></div>
            <div className="l">bad GPS</div>
          </div>
        </div>
      )}
    </Panel>
  );
}
