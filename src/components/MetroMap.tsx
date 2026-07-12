"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { METRO_LINES } from "@/lib/metro";
import { LINE_PATTERNS, STATION_COORDS } from "@/lib/metroRouting";
import { Panel } from "./Panel";

interface SavedRoute {
  stations: string[];
  from: string;
  to: string;
  ts: number;
}

const W = 760;
const H = 700;
const PAD = 26;

const LINE_BY_KEY = new Map(METRO_LINES.map((l) => [l.key, l]));

// Geographic (not schematic) map of the whole network, drawn straight from the
// GTFS coordinates. Clicking a station jumps to the planner with it selected.
export function MetroMap() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  // Last route computed by the planner (saved to localStorage) — highlighted
  // on the map so you can see your journey across the whole network.
  const [saved, setSaved] = useState<SavedRoute | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastMetroRoute");
      if (!raw) return;
      const r = JSON.parse(raw) as SavedRoute;
      // only show recent plans (last 24h)
      if (r.stations?.length > 1 && Date.now() - r.ts < 24 * 3600_000) setSaved(r);
    } catch {
      /* ignore */
    }
  }, []);
  const onRoute = useMemo(() => new Set(saved?.stations ?? []), [saved]);
  const clearRoute = () => {
    localStorage.removeItem("lastMetroRoute");
    setSaved(null);
  };

  const { project, coordByName } = useMemo(() => {
    const lats = STATION_COORDS.map((s) => s.lat);
    const lngs = STATION_COORDS.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const project = (lat: number, lng: number) => ({
      x: PAD + ((lng - minLng) / (maxLng - minLng)) * (W - PAD * 2),
      y: PAD + (1 - (lat - minLat) / (maxLat - minLat)) * (H - PAD * 2),
    });
    const coordByName = new Map(STATION_COORDS.map((s) => [s.name, s]));
    return { project, coordByName };
  }, []);

  const pick = (name: string) => {
    router.push(`/?station=${encodeURIComponent(name)}`);
  };

  return (
    <Panel
      title="Metro Network Map"
      icon="🗺️"
      source="Drawn from DMRC GTFS coordinates · click any station to plan a trip from it"
    >
      {saved && (
        <div className="note" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1 }}>
            ✨ Showing your planned route: <b>{saved.from}</b> → <b>{saved.to}</b> (
            {saved.stations.length} stations)
          </span>
          <button className="bus-info-close" onClick={clearRoute}>
            ✕ clear
          </button>
        </div>
      )}
      <div className="metro-map">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Delhi Metro network map">
          {/* line paths — every service pattern, so branches are drawn too */}
          {Object.entries(LINE_PATTERNS).map(([key, patterns]) => {
            const color = LINE_BY_KEY.get(key)?.color ?? "#888";
            return patterns.map((pat, pi) => {
              const pts = pat
                .map((n) => coordByName.get(n))
                .filter((s): s is NonNullable<typeof s> => !!s)
                .map((s) => project(s.lat, s.lng));
              if (pts.length < 2) return null;
              const dAttr = pts
                .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                .join(" ");
              return (
                <path
                  key={`${key}-${pi}`}
                  d={dAttr}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={saved ? 0.16 : 0.75}
                  pathLength={1}
                  className="metro-map-line"
                />
              );
            });
          })}

          {/* planned route overlay */}
          {saved && (() => {
            const pts = saved.stations
              .map((n) => coordByName.get(n))
              .filter((s): s is NonNullable<typeof s> => !!s)
              .map((s) => project(s.lat, s.lng));
            if (pts.length < 2) return null;
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(" ");
            return (
              <g>
                <path d={d} fill="none" stroke="#ffffff" strokeWidth={6} opacity={0.22} strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d={d}
                  fill="none"
                  stroke="#7ce0c3"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="route-path-line"
                />
              </g>
            );
          })()}

          {/* stations */}
          {STATION_COORDS.map((s) => {
            const { x, y } = project(s.lat, s.lng);
            const interchange = s.lines.length > 1;
            const hovered = hover === s.name;
            const routed = onRoute.has(s.name);
            return (
              <g key={s.name} opacity={saved && !routed ? 0.3 : 1}>
                <circle
                  cx={x}
                  cy={y}
                  r={hovered ? 8 : routed ? 5.5 : interchange ? 5 : 3}
                  fill={routed ? "#7ce0c3" : interchange ? "#ffffff" : "#c9d4f0"}
                  stroke="#0a1026"
                  strokeWidth={interchange ? 2 : 1}
                  className="metro-map-station"
                  onClick={() => pick(s.name)}
                  onMouseEnter={() => setHover(s.name)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>
                    {s.name} — {s.lines.map((l) => LINE_BY_KEY.get(l)?.name ?? l).join(", ")}
                  </title>
                </circle>
                {hovered && (
                  <text x={x} y={y - 12} textAnchor="middle" className="metro-map-label">
                    {s.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend">
        {METRO_LINES.map((l) => (
          <span key={l.key}>
            <i style={{ background: l.color, color: l.color }} /> {l.name}
          </span>
        ))}
      </div>
    </Panel>
  );
}
