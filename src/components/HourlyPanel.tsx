"use client";

import { useMemo } from "react";
import { aqiColor } from "@/lib/aqi";
import { useFeeds } from "@/lib/feeds";
import type { HourlyWx } from "@/lib/types";
import { Panel } from "./Panel";

// "2026-07-12T20:00" -> "8 pm" (string parsing avoids timezone ambiguity —
// Open-Meteo returns local IST strings).
function hourLabel(t: string): string {
  const h = Number(t.split("T")[1]?.slice(0, 2));
  if (!Number.isFinite(h)) return t;
  const twelve = ((h + 11) % 12) + 1;
  return `${twelve} ${h >= 12 ? "pm" : "am"}`;
}
function hourOf(t: string): number {
  return Number(t.split("T")[1]?.slice(0, 2));
}

// Comfort penalty for one hour: lower is better. Mirrors the head-out score's
// weighting — AQI dominates, then heat, then rain chance.
function hourPenalty(h: HourlyWx, aqi: number | null): number {
  let p = 0;
  if (aqi == null) p += 30;
  else if (aqi <= 50) p += 0;
  else if (aqi <= 100) p += 12;
  else if (aqi <= 150) p += 28;
  else if (aqi <= 200) p += 48;
  else if (aqi <= 300) p += 70;
  else p += 90;
  const feels = h.apparent ?? h.temp;
  if (feels != null) {
    if (feels > 42) p += 40;
    else if (feels > 38) p += 24;
    else if (feels > 32) p += 10;
  }
  p += (h.rainProb ?? 0) * 0.2;
  return p;
}

export function HourlyPanel() {
  const { weather, air } = useFeeds();
  const env = weather.data;
  const hourly = env?.data.hourly ?? [];

  // AQI forecast lookup by hour string.
  const aqiByT = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of air.data?.data.forecast ?? []) {
      if (p.aqi != null) m.set(p.t, p.aqi);
    }
    return m;
  }, [air.data]);

  // Best waking hour (6am–11pm) in the next 24h.
  const best = useMemo(() => {
    const candidates = hourly.filter((h) => {
      const hr = hourOf(h.t);
      return hr >= 6 && hr <= 23;
    });
    if (candidates.length === 0) return null;
    let bestH = candidates[0];
    let bestP = Infinity;
    for (const h of candidates) {
      const p = hourPenalty(h, aqiByT.get(h.t) ?? null);
      if (p < bestP) {
        bestP = p;
        bestH = h;
      }
    }
    return bestH;
  }, [hourly, aqiByT]);

  return (
    <Panel
      title="Next 24 Hours"
      icon="🕐"
      source={env?.source ?? "Open-Meteo Forecast"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {weather.loading && !env && <div className="skeleton sk-block" style={{ height: 110 }} />}

      {best && (
        <div className="best-hour">
          ⭐ Best time to head out: <b>{hourLabel(best.t)}</b>
          <span>
            {" "}
            · {best.emoji} {best.temp != null ? `${Math.round(best.temp)}°` : ""}
            {aqiByT.get(best.t) != null ? ` · AQI ~${aqiByT.get(best.t)}` : ""}
            {best.rainProb ? ` · ${best.rainProb}% rain` : ""} — combining heat, air & rain
            forecasts
          </span>
        </div>
      )}

      {hourly.length > 0 && (
        <div className="hourly-strip">
          {hourly.map((h, i) => {
            const aqi = aqiByT.get(h.t) ?? null;
            const isBest = best?.t === h.t;
            return (
              <div className={`hour-tile ${isBest ? "best" : ""}`} key={h.t} style={{ "--i": i } as React.CSSProperties}>
                <div className="hour-time">{hourLabel(h.t)}</div>
                <div className="hour-emoji">{h.emoji}</div>
                <div className="hour-temp">{h.temp != null ? `${Math.round(h.temp)}°` : "—"}</div>
                <div className={`hour-rain ${h.rainProb ? "" : "dim"}`}>
                  💧{h.rainProb ?? 0}%
                </div>
                {aqi != null && (
                  <div className="hour-aqi" style={{ color: aqiColor(aqi) }}>
                    ● {aqi}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
