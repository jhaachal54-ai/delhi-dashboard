"use client";

import { useFeeds } from "@/lib/feeds";
import { Panel } from "./Panel";

// "HH:MM" + minutes -> "H:MM am/pm"
function shift(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  let total = h * 60 + m + mins;
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const ap = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
}

export function GoldenHour() {
  const { data } = useFeeds().weather;
  const d = data?.data;
  const sr = d?.sunrise;
  const ss = d?.sunset;

  const windows =
    sr && ss
      ? [
          { icon: "🔵", label: "Blue hour (dawn)", time: `${shift(sr, -30)} – ${sr.replace(/^0/, "")}` },
          { icon: "🌅", label: "Golden hour (morning)", time: `${shift(sr, 0)} – ${shift(sr, 60)}` },
          { icon: "🌇", label: "Golden hour (evening)", time: `${shift(ss, -60)} – ${shift(ss, 0)}` },
          { icon: "🔵", label: "Blue hour (dusk)", time: `${shift(ss, 0)} – ${shift(ss, 30)}` },
        ]
      : [];

  return (
    <Panel title="Photography Light" icon="📸" source="Golden & blue hours from today's sun">
      {windows.length === 0 && <div className="hint">Waiting for sunrise/sunset…</div>}
      <div className="golden-list">
        {windows.map((w) => (
          <div className="golden-row" key={w.label}>
            <span className="golden-ic">{w.icon}</span>
            <span className="golden-label">{w.label}</span>
            <span className="golden-time">{w.time}</span>
          </div>
        ))}
      </div>
      <div className="hint">Soft, warm light for photos — and the coolest, calmest hours to be out.</div>
    </Panel>
  );
}
