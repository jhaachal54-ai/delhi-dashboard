"use client";

import { useFeeds } from "@/lib/feeds";
import type { TrendDay } from "@/lib/types";
import { Panel } from "./Panel";

function aqiColor(aqi: number | null): string {
  if (aqi == null) return "#556";
  if (aqi <= 50) return "#4ade80";
  if (aqi <= 100) return "#facc15";
  if (aqi <= 150) return "#fb923c";
  if (aqi <= 200) return "#fb7185";
  if (aqi <= 300) return "#c084fc";
  return "#f43f5e";
}

const W = 580;
const H = 244;
const PAD = { top: 20, right: 16, bottom: 48, left: 16 };

function Chart({ days }: { days: TrendDay[] }) {
  const n = days.length;
  if (n < 2) return <div className="empty">Not enough history yet.</div>;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = innerW / (n - 1);
  const x = (i: number) => PAD.left + i * step;

  // Temperature scale (shared for max & min lines).
  const temps = days.flatMap((d) => [d.tMax, d.tMin].filter((v): v is number => v != null));
  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const tRange = tMax - tMin || 1;
  const yTemp = (v: number) => PAD.top + (1 - (v - tMin) / tRange) * innerH;

  // AQI scale for the background bars.
  const aqis = days.map((d) => d.aqi).filter((v): v is number => v != null);
  const aqiMax = Math.max(120, ...aqis);
  const barW = step * 0.44;

  const maxLine = days
    .map((d, i) => (d.tMax != null ? `${i === 0 ? "M" : "L"}${x(i)},${yTemp(d.tMax)}` : ""))
    .filter(Boolean)
    .join(" ");
  const minLine = days
    .map((d, i) => (d.tMin != null ? `${i === 0 ? "M" : "L"}${x(i)},${yTemp(d.tMin)}` : ""))
    .filter(Boolean)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="7-day AQI and temperature trend">
      {/* AQI bars */}
      {days.map((d, i) => {
        if (d.aqi == null) return null;
        const h = (d.aqi / aqiMax) * innerH;
        return (
          <rect
            key={`b${i}`}
            x={x(i) - barW / 2}
            y={PAD.top + innerH - h}
            width={barW}
            height={h}
            rx={4}
            fill={aqiColor(d.aqi)}
            opacity={d.isToday ? 0.5 : 0.28}
            className="trend-bar"
            style={{ "--k": i, transformOrigin: `${x(i)}px ${PAD.top + innerH}px` } as React.CSSProperties}
          >
            <title>{`${d.label}: AQI ${d.aqi}`}</title>
          </rect>
        );
      })}

      {/* temperature range area */}
      {maxLine && minLine && (
        <path
          d={`${maxLine} L${x(n - 1)},${yTemp(days[n - 1].tMin ?? tMin)} ${days
            .slice()
            .reverse()
            .map((d, ri) => {
              const i = n - 1 - ri;
              return d.tMin != null ? `L${x(i)},${yTemp(d.tMin)}` : "";
            })
            .filter(Boolean)
            .join(" ")} Z`}
          fill="rgba(255,169,120,0.10)"
        />
      )}

      {/* temp lines */}
      <path d={maxLine} fill="none" stroke="#ff9d7e" strokeWidth={2.5} strokeLinecap="round" />
      <path d={minLine} fill="none" stroke="#7cc4ff" strokeWidth={2} strokeLinecap="round" strokeDasharray="1 5" />

      {/* points + day labels */}
      {days.map((d, i) => (
        <g key={`p${i}`}>
          {d.tMax != null && <circle cx={x(i)} cy={yTemp(d.tMax)} r={d.isToday ? 4 : 3} fill="#ff9d7e" />}
          {d.tMax != null && (
            <text x={x(i)} y={yTemp(d.tMax) - 8} textAnchor="middle" className="trend-temp-lbl">
              {Math.round(d.tMax)}°
            </text>
          )}
          <text
            x={x(i)}
            y={H - 26}
            textAnchor="middle"
            className={d.isToday ? "trend-x-lbl today" : "trend-x-lbl"}
          >
            {d.isToday ? "Today" : d.label}
          </text>
          {(d.rain ?? 0) > 0 && (
            <text x={x(i)} y={H - 10} textAnchor="middle" className="trend-rain-lbl">
              💧{d.rain!.toFixed(d.rain! >= 10 ? 0 : 1)}mm
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function TrendPanel() {
  const { data, loading } = useFeeds().trend;
  const env = data;
  const days = env?.data.days ?? [];

  return (
    <Panel
      title="7-Day Trend"
      icon="📈"
      source={env?.source ?? "Open-Meteo (7-day history)"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {loading && !env && <div className="skeleton sk-block" style={{ height: 200 }} />}
      {env?.note && <div className="note">{env.note}</div>}

      {env && days.length > 0 && (
        <>
          <Chart days={days} />
          <div className="legend">
            <span>
              <i style={{ background: "#ff9d7e" }} /> daily high °C
            </span>
            <span>
              <i style={{ background: "#7cc4ff" }} /> daily low °C
            </span>
            <span>
              <i style={{ background: "#fb923c" }} /> daily mean AQI (bars)
            </span>
            <span>
              <i style={{ background: "#7cc4ff" }} /> 💧 daily rain (mm)
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}
