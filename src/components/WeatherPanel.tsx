"use client";

import { useFeeds } from "@/lib/feeds";
import { AnimatedNumber } from "./AnimatedNumber";
import { Panel } from "./Panel";

export function WeatherPanel() {
  const { data, loading } = useFeeds().weather;
  const env = data;
  const d = env?.data;

  return (
    <Panel
      title="Weather"
      icon="🌡️"
      source={env?.source ?? "Open-Meteo Forecast"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {loading && !env && (
        <>
          <div className="skeleton sk-block" style={{ height: 70 }} />
          <div className="skeleton sk-line" style={{ width: "70%" }} />
        </>
      )}
      {env?.note && <div className="note">{env.note}</div>}

      {d && (
        <>
          <div className="wx">
            <div className="emoji">{d.emoji}</div>
            <div>
              <div className="temp">
                <AnimatedNumber value={d.temperature} decimals={1} suffix="°" />
              </div>
              <div className="desc">{d.description}</div>
            </div>
          </div>

          <div className="wx-grid">
            <div className="w">
              <b><AnimatedNumber value={d.apparent} suffix="°" /></b>
              <span>Feels like</span>
            </div>
            <div className="w">
              <b><AnimatedNumber value={d.humidity} suffix="%" /></b>
              <span>Humidity</span>
            </div>
            <div className="w">
              <b><AnimatedNumber value={d.windSpeed} /></b>
              <span>Wind km/h</span>
            </div>
            <div className="w">
              <b>{d.uvIndex != null ? d.uvIndex.toFixed(1) : "—"}</b>
              <span>UV index</span>
            </div>
            <div className="w">
              <b>{d.sunrise ?? "—"}</b>
              <span>🌅 Sunrise</span>
            </div>
            <div className="w">
              <b>{d.sunset ?? "—"}</b>
              <span>🌇 Sunset</span>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
