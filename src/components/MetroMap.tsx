"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    router.push(`/home?station=${encodeURIComponent(name)}`);
  };

  // Trains glide along the real line geometry via SVG motion paths. Gated on
  // reduced-motion (SMIL isn't covered by the global CSS motion kill-switch).
  const [motionOk, setMotionOk] = useState(false);
  useEffect(() => {
    setMotionOk(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Every drawn line pattern, with a stable id so <mpath> can reference it.
  const linePaths = useMemo(() => {
    const out: { id: string; d: string; color: string; stops: number; first: boolean }[] = [];
    for (const [key, patterns] of Object.entries(LINE_PATTERNS)) {
      const color = LINE_BY_KEY.get(key)?.color ?? "#888";
      patterns.forEach((pat, pi) => {
        const pts = pat
          .map((n) => coordByName.get(n))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map((s) => project(s.lat, s.lng));
        if (pts.length < 2) return;
        out.push({
          id: `mp-${key}-${pi}`,
          d: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
          color,
          stops: pts.length,
          first: pi === 0,
        });
      });
    }
    return out;
  }, [project, coordByName]);

  // Drive the trains from rAF + getPointAtLength (rather than SMIL, which not
  // every engine reliably advances). Each train ping-pongs end-to-end.
  const svgRef = useRef<SVGSVGElement>(null);
  const trainRefs = useRef(new Map<string, SVGCircleElement>());
  const trains = useMemo(
    () =>
      linePaths
        .filter((lp) => lp.first)
        .flatMap((lp) =>
          [0, 0.5].map((phase) => ({
            key: `${lp.id}-t${phase}`,
            pathId: lp.id,
            color: lp.color,
            phase,
            dur: (18 + lp.stops * 0.6) * 1000,
          }))
        ),
    [linePaths]
  );

  useEffect(() => {
    if (!motionOk || saved) return;
    const svg = svgRef.current;
    if (!svg) return;
    const specs = trains
      .map((t) => {
        const el = svg.querySelector<SVGPathElement>(`[id="${t.pathId}"]`);
        if (!el) return null;
        const len = el.getTotalLength();
        return len > 1 ? { ...t, el, len } : null;
      })
      .filter((s): s is NonNullable<typeof s> => !!s);
    if (specs.length === 0) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      for (const s of specs) {
        const dot = trainRefs.current.get(s.key);
        if (!dot) continue;
        const p = ((t / s.dur + s.phase) % 1 + 1) % 1;
        const tri = p < 0.5 ? p * 2 : (1 - p) * 2; // 0→1→0
        const pt = s.el.getPointAtLength(tri * s.len);
        dot.setAttribute("cx", pt.x.toFixed(1));
        dot.setAttribute("cy", pt.y.toFixed(1));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motionOk, saved, trains]);

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
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Delhi Metro network map">
          {/* line paths — every service pattern, so branches are drawn too */}
          {linePaths.map((lp) => (
            <path
              key={lp.id}
              id={lp.id}
              d={lp.d}
              fill="none"
              stroke={lp.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={saved ? 0.16 : 0.75}
              pathLength={1}
              className="metro-map-line"
            />
          ))}

          {/* trains gliding along each line's real geometry (positioned by rAF) */}
          {motionOk &&
            !saved &&
            trains.map((t) => (
              <circle
                key={t.key}
                ref={(el) => {
                  if (el) trainRefs.current.set(t.key, el);
                  else trainRefs.current.delete(t.key);
                }}
                cx={-99}
                cy={-99}
                r={3.6}
                style={{ fill: "var(--mk-train)", stroke: t.color }}
                strokeWidth={2}
                className="metro-train"
              />
            ))}

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
                <path d={d} fill="none" style={{ stroke: "var(--mk-halo)" }} strokeWidth={6} opacity={0.28} strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d={d}
                  fill="none"
                  style={{ stroke: "var(--mk-route)" }}
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
                  style={{
                    fill: routed
                      ? "var(--mk-route)"
                      : interchange
                        ? "var(--mk-station-ix)"
                        : "var(--mk-station)",
                    stroke: "var(--mk-station-stroke)",
                  }}
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
