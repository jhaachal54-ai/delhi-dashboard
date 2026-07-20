"use client";

import { useFeeds } from "@/lib/feeds";
import { Panel } from "./Panel";

export function ForecastPanel() {
  const { data } = useFeeds().weather;
  const days = data?.data.daily ?? [];

  // Scale the temperature bars across the week's own min/max.
  const highs = days.map((d) => d.tempMax).filter((v): v is number => v != null);
  const lows = days.map((d) => d.tempMin).filter((v): v is number => v != null);
  const max = highs.length ? Math.max(...highs) : 40;
  const min = lows.length ? Math.min(...lows) : 20;
  const span = max - min || 1;

  return (
    <Panel
      title="7-Day Forecast"
      icon="📅"
      source="Open-Meteo (daily forecast)"
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {days.length === 0 && <div className="hint">Forecast loading…</div>}
      <div className="forecast-row">
        {days.map((d, i) => {
          const hi = d.tempMax ?? max;
          const lo = d.tempMin ?? min;
          const top = ((max - hi) / span) * 100;
          const bot = ((lo - min) / span) * 100;
          return (
            <div className="fc-day" key={d.date}>
              <div className="fc-lbl">{i === 0 ? "Today" : d.label}</div>
              <div className="fc-emoji">{d.emoji}</div>
              <div className="fc-bar-wrap" title={`${Math.round(lo)}°–${Math.round(hi)}°`}>
                <div
                  className="fc-bar"
                  style={{ top: `${top}%`, bottom: `${bot}%` }}
                />
              </div>
              <div className="fc-hi">{d.tempMax != null ? `${Math.round(d.tempMax)}°` : "—"}</div>
              <div className="fc-lo">{d.tempMin != null ? `${Math.round(d.tempMin)}°` : "—"}</div>
              {d.rainProb != null && d.rainProb > 0 && (
                <div className="fc-rain">💧{Math.round(d.rainProb)}%</div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
