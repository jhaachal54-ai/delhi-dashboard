"use client";

import { useFeeds } from "@/lib/feeds";
import { useCountUp } from "@/lib/useCountUp";
import { AnimatedNumber } from "./AnimatedNumber";
import { Panel } from "./Panel";

function aqiColor(aqi: number | null): string {
  if (aqi == null) return "#97a1c0";
  if (aqi <= 50) return "#4ade80";
  if (aqi <= 100) return "#facc15";
  if (aqi <= 150) return "#fb923c";
  if (aqi <= 200) return "#fb7185";
  if (aqi <= 300) return "#c084fc";
  return "#f43f5e";
}

const R = 56;
const C = 2 * Math.PI * R;

// Rough typical US-AQI for Delhi by month (monsoon clears the air; winter is
// brutal). Used only to give "better/worse than usual" context — not precise.
const TYPICAL_AQI = [385, 250, 175, 195, 205, 175, 95, 85, 120, 235, 350, 360];

function seasonalContext(aqi: number | null): string | null {
  if (aqi == null) return null;
  const month = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", month: "numeric" }).format(new Date())
  );
  const typical = TYPICAL_AQI[month - 1];
  const monthName = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", month: "long" }).format(new Date());
  const diff = aqi - typical;
  if (Math.abs(diff) <= 25) return `About typical for ${monthName} in Delhi (usually ~${typical}).`;
  if (diff < 0) return `Cleaner than a usual ${monthName} day (typically ~${typical}).`;
  return `Worse than a usual ${monthName} day (typically ~${typical}).`;
}

function Gauge({ aqi, category }: { aqi: number | null; category: string }) {
  const color = aqiColor(aqi);
  const animated = useCountUp(aqi);
  const frac = Math.max(0, Math.min(1, (aqi ?? 0) / 500));
  const offset = C * (1 - frac);
  return (
    <div className="gauge">
      <svg viewBox="0 0 132 132">
        <circle className="arc-bg" cx="66" cy="66" r={R} strokeWidth="12" />
        <circle
          className="arc-fg"
          cx="66"
          cy="66"
          r={R}
          strokeWidth="12"
          stroke={color}
          style={{ color, strokeDasharray: C, strokeDashoffset: offset }}
        />
      </svg>
      <div className="center">
        <div>
          <div className="num" style={{ color }}>
            {aqi == null ? "—" : Math.round(animated)}
          </div>
          <div className="lbl">US AQI</div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ series }: { series: { t: string; aqi: number | null }[] }) {
  const pts = series.filter((p) => p.aqi != null) as { t: string; aqi: number }[];
  if (pts.length < 2) return null;
  const w = 150;
  const h = 40;
  const vals = pts.map((p) => p.aqi);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((p.aqi - min) / range) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const stroke = aqiColor(vals[vals.length - 1]);
  return (
    <svg width={w} height={h} style={{ maxWidth: "100%", marginTop: 6 }} aria-label="24-hour AQI trend">
      <defs>
        <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#aqiFill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function AirPanel() {
  const { data, loading } = useFeeds().air;
  const env = data;
  const d = env?.data;
  const color = aqiColor(d?.usAqi ?? null);

  return (
    <Panel
      title="Air Quality"
      icon="🌫️"
      source={env?.source ?? "Open-Meteo Air Quality"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {loading && !env && (
        <>
          <div className="skeleton sk-block" />
          <div className="skeleton sk-line" style={{ width: "60%" }} />
        </>
      )}
      {env?.note && <div className="note">{env.note}</div>}

      {d && (
        <>
          <div className="aqi-hero">
            <Gauge aqi={d.usAqi} category={d.category} />
            <div>
              <div className="aqi-cat" style={{ color }}>
                {d.category}
              </div>
              <div className="aqi-sub">Connaught Place · US EPA scale</div>
              <Sparkline series={d.series} />
            </div>
          </div>

          {seasonalContext(d.usAqi) && <div className="hint">📅 {seasonalContext(d.usAqi)}</div>}

          <div className="pollutants">
            <div className="p">
              PM2.5 <b><AnimatedNumber value={d.pm2_5} /></b>
            </div>
            <div className="p">
              PM10 <b><AnimatedNumber value={d.pm10} /></b>
            </div>
            <div className="p">
              NO₂ <b><AnimatedNumber value={d.no2} /></b>
            </div>
            <div className="p">
              O₃ <b><AnimatedNumber value={d.o3} /></b>
            </div>
            <div className="p">
              CO <b><AnimatedNumber value={d.co} /></b>
            </div>
            <div className="p">
              SO₂ <b><AnimatedNumber value={d.so2} /></b>
            </div>
            {d.dust != null && (
              <div className="p" title="Airborne dust (µg/m³) — Thar & construction dust">
                🏜️ Dust <b><AnimatedNumber value={d.dust} /></b>
              </div>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
