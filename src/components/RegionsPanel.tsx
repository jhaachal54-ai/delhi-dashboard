"use client";

import { aqiColor } from "@/lib/aqi";
import { useFeeds } from "@/lib/feeds";
import { Panel } from "./Panel";

// Micro-climates across Delhi-NCR: 12 locations from one Open-Meteo call, so
// you can see Najafgarh raining while Safdarjung stays dry.
export function RegionsPanel() {
  const { data, loading } = useFeeds().regions;
  const env = data;
  const regions = env?.data.regions ?? [];

  // Range highlights: hottest and wettest region right now.
  const temps = regions.map((r) => r.temperature).filter((v): v is number => v != null);
  const maxTemp = temps.length ? Math.max(...temps) : null;
  const minTemp = temps.length ? Math.min(...temps) : null;
  const wettest = regions.reduce<number>((m, r) => Math.max(m, r.precipitation ?? 0), 0);

  return (
    <Panel
      title="Region-wise Weather"
      icon="🗾"
      source={env?.source ?? "Open-Meteo (12 NCR locations)"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {loading && !env && <div className="skeleton sk-block" style={{ height: 140 }} />}
      {env?.note && <div className="note">{env.note}</div>}

      {regions.length > 0 && (
        <>
          {maxTemp != null && minTemp != null && maxTemp - minTemp >= 0.1 && (
            <div className="hint">
              Right now the NCR spans <b>{minTemp.toFixed(1)}°</b> to{" "}
              <b>{maxTemp.toFixed(1)}°</b>
              {wettest > 0 ? " — and it's raining in parts of the region." : "."}
            </div>
          )}
          <div className="region-grid">
            {regions.map((r, i) => (
              <div
                className={`region-tile ${r.temperature != null && r.temperature === maxTemp ? "hot" : ""} ${
                  (r.precipitation ?? 0) > 0 ? "wet" : ""
                }`}
                key={r.key}
                style={{ "--i": i % 6 } as React.CSSProperties}
              >
                <div className="region-name">{r.name}</div>
                <div className="region-main">
                  <span className="region-emoji">{r.emoji}</span>
                  <span className="region-temp">
                    {r.temperature != null ? `${r.temperature.toFixed(1)}°` : "—"}
                  </span>
                  {r.usAqi != null && (
                    <span
                      className="region-aqi"
                      style={{ color: aqiColor(r.usAqi), borderColor: aqiColor(r.usAqi) }}
                      title={`US AQI ${r.usAqi}${r.pm2_5 != null ? ` · PM2.5 ${Math.round(r.pm2_5)}` : ""}`}
                    >
                      AQI {r.usAqi}
                    </span>
                  )}
                </div>
                <div className="region-meta">
                  {r.description}
                  {r.apparent != null ? ` · feels ${Math.round(r.apparent)}°` : ""}
                  {(r.precipitation ?? 0) > 0 ? ` · 🌧️ ${r.precipitation} mm` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
