"use client";

import { useFeeds } from "@/lib/feeds";
import { Panel } from "./Panel";

function aqiColor(aqi: number): string {
  if (aqi <= 50) return "#4ade80";
  if (aqi <= 100) return "#facc15";
  if (aqi <= 150) return "#fb923c";
  if (aqi <= 200) return "#fb7185";
  if (aqi <= 300) return "#c084fc";
  return "#f43f5e";
}

export function RegionLeaderboard() {
  const { data } = useFeeds().regions;
  const regions = (data?.data.regions ?? [])
    .filter((r) => r.usAqi != null)
    .sort((a, b) => (a.usAqi ?? 0) - (b.usAqi ?? 0));

  const worst = regions.length ? regions[regions.length - 1].usAqi ?? 1 : 1;

  return (
    <Panel
      title="Cleanest Air Right Now"
      icon="🏆"
      source="Ranked across 12 NCR locations (Open-Meteo)"
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {regions.length === 0 && <div className="hint">Region readings loading…</div>}
      <div className="rank-list">
        {regions.map((r, i) => {
          const aqi = r.usAqi ?? 0;
          const color = aqiColor(aqi);
          const pct = Math.max(6, (aqi / worst) * 100);
          return (
            <div className="rank-row" key={r.key}>
              <span className="rank-pos">{i + 1}</span>
              <span className="rank-name">{r.name}</span>
              <span className="rank-bar-wrap">
                <span className="rank-bar" style={{ width: `${pct}%`, background: color }} />
              </span>
              <b className="rank-val" style={{ color }}>
                {aqi}
              </b>
            </div>
          );
        })}
      </div>
      {regions.length > 0 && (
        <div className="hint">
          Lower is cleaner. Best right now: <b>{regions[0].name}</b> at {regions[0].usAqi};
          worst: <b>{regions[regions.length - 1].name}</b> at {regions[regions.length - 1].usAqi}.
        </div>
      )}
    </Panel>
  );
}
