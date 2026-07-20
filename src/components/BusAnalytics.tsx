"use client";

import { useMemo } from "react";
import { CITY } from "@/lib/config";
import { useFeeds } from "@/lib/feeds";
import { busNumber } from "@/lib/busNames";
import { Panel } from "./Panel";

// Which quadrant of the city a fix falls in (for a rough coverage read).
function quadrant(lat: number, lng: number): string {
  const ns = lat >= CITY.lat ? "North" : "South";
  const ew = lng >= CITY.lng ? "East" : "West";
  return `${ns}-${ew}`;
}

export function BusAnalytics() {
  const { data } = useFeeds().transit;
  const buses = data?.data.buses ?? [];

  const { topRoutes, coverage, freshPct } = useMemo(() => {
    const byRoute = new Map<string, number>();
    const byQuad = new Map<string, number>();
    let fresh = 0;
    let located = 0;
    for (const b of buses) {
      if (b.routeId) {
        const num = busNumber(b.routeId) ?? `ref ${b.routeId}`;
        byRoute.set(num, (byRoute.get(num) ?? 0) + 1);
      }
      if (!b.suspect) {
        located++;
        byQuad.set(quadrant(b.lat, b.lng), (byQuad.get(quadrant(b.lat, b.lng)) ?? 0) + 1);
        if (!b.stale) fresh++;
      }
    }
    const topRoutes = [...byRoute.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const coverage = ["North-West", "North-East", "South-West", "South-East"].map((q) => ({
      q,
      n: byQuad.get(q) ?? 0,
    }));
    return {
      topRoutes,
      coverage,
      freshPct: located ? Math.round((fresh / located) * 100) : null,
    };
  }, [buses]);

  const maxRoute = topRoutes.length ? topRoutes[0][1] : 1;
  const maxQuad = Math.max(1, ...coverage.map((c) => c.n));

  return (
    <Panel
      title="Fleet Analytics"
      icon="📊"
      source="Derived live from the DTC/DIMTS feed"
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {buses.length === 0 && <div className="hint">Waiting for the live bus feed…</div>}
      {buses.length > 0 && (
        <div className="analytics-grid">
          <div className="analytics-col">
            <div className="analytics-h">Busiest routes right now</div>
            <div className="rank-list">
              {topRoutes.map(([route, n]) => (
                <div className="rank-row" key={route}>
                  <span className="bus-no" style={{ minWidth: 54 }}>{route}</span>
                  <span className="rank-bar-wrap">
                    <span className="rank-bar" style={{ width: `${(n / maxRoute) * 100}%` }} />
                  </span>
                  <b className="rank-val">{n}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="analytics-col">
            <div className="analytics-h">Coverage by quadrant</div>
            <div className="rank-list">
              {coverage.map((c) => (
                <div className="rank-row" key={c.q}>
                  <span className="rank-name" style={{ minWidth: 88 }}>{c.q}</span>
                  <span className="rank-bar-wrap">
                    <span
                      className="rank-bar"
                      style={{ width: `${(c.n / maxQuad) * 100}%`, background: "#6ea8fe" }}
                    />
                  </span>
                  <b className="rank-val">{c.n}</b>
                </div>
              ))}
            </div>
            {freshPct != null && (
              <div className="hint" style={{ marginTop: 8 }}>
                {freshPct}% of located buses have a fresh (&lt;2 min) GPS fix.
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
