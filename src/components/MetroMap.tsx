"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { METRO_LINES } from "@/lib/metro";
import { LINE_PATTERNS, STATION_COORDS } from "@/lib/metroRouting";
import { Panel } from "./Panel";

const W = 760;
const H = 700;
const PAD = 26;

const LINE_BY_KEY = new Map(METRO_LINES.map((l) => [l.key, l]));

// Geographic (not schematic) map of the whole network, drawn straight from the
// GTFS coordinates. Clicking a station jumps to the planner with it selected.
export function MetroMap() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

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
                  opacity={0.75}
                  pathLength={1}
                  className="metro-map-line"
                />
              );
            });
          })}

          {/* stations */}
          {STATION_COORDS.map((s) => {
            const { x, y } = project(s.lat, s.lng);
            const interchange = s.lines.length > 1;
            const hovered = hover === s.name;
            return (
              <g key={s.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={hovered ? 8 : interchange ? 5 : 3}
                  fill={interchange ? "#ffffff" : "#c9d4f0"}
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
