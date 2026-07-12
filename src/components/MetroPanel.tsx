"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { METRO_LINES, istMinutesNow, lineStatus } from "@/lib/metro";
import { LINE_PATTERNS, SERVICE_HOURS, STATIONS } from "@/lib/metroRouting";
import { Panel } from "./Panel";

// Longest service pattern per line = the full ordered stop list.
function fullPattern(lineKey: string): string[] {
  const patterns = LINE_PATTERNS[lineKey] ?? [];
  return patterns.reduce<string[]>((best, p) => (p.length > best.length ? p : best), []);
}

export function MetroPanel() {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);

  // Re-evaluate operating status on a minute tick so lines flip at open/close.
  const [nowMin, setNowMin] = useState<number | null>(null);
  useEffect(() => {
    setNowMin(istMinutesNow());
    const id = setInterval(() => setNowMin(istMinutesNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const running =
    nowMin == null ? 0 : METRO_LINES.filter((l) => lineStatus(l, nowMin).running).length;

  return (
    <Panel
      title="Delhi Metro"
      icon="🚇"
      source="DMRC / NMRC network · service hours & stops from official GTFS"
      status={nowMin == null ? null : "live"}
    >
      <div className="metro-head">
        <div>
          <b>{running}</b> of {METRO_LINES.length} lines running
        </div>
        <div className="metro-note">
          Operating status is derived from each line&apos;s service hours (live disruption
          data isn&apos;t publicly available). Expand a line to see every stop — click a stop
          to plan a trip from it.
        </div>
      </div>

      <div className="metro-list">
        {METRO_LINES.map((l) => {
          const st = nowMin == null ? null : lineStatus(l, nowMin);
          const isOpen = open === l.key;
          const stops = isOpen ? fullPattern(l.key) : [];
          return (
            <div key={l.key} className="metro-block">
              <div className="metro-row" style={{ borderLeftColor: l.color }}>
                <span
                  className="metro-swatch"
                  style={{ background: l.color, color: l.dark ? "#111" : "#fff" }}
                >
                  {l.stations}
                </span>
                <div className="metro-info">
                  <div className="metro-name">{l.name} Line</div>
                  <div className="metro-route">
                    {l.from} → {l.to}
                  </div>
                  {SERVICE_HOURS[l.key] && (
                    <div className="metro-times">
                      ⏰ First {SERVICE_HOURS[l.key].first} · Last {SERVICE_HOURS[l.key].last}
                    </div>
                  )}
                </div>
                {st && (
                  <span className={`metro-status ${st.running ? "on" : "off"}`}>
                    {st.label}
                  </span>
                )}
                <button
                  className={`metro-expand ${isOpen ? "open" : ""}`}
                  onClick={() => setOpen(isOpen ? null : l.key)}
                  aria-label={`${isOpen ? "Hide" : "Show"} ${l.name} Line stops`}
                >
                  ▾
                </button>
              </div>

              {isOpen && (
                <div className="metro-stops">
                  {stops.map((s, i) => {
                    const interchange = (STATIONS[s]?.length ?? 1) > 1;
                    return (
                      <button
                        key={s}
                        className={`metro-stop ${interchange ? "ix" : ""}`}
                        onClick={() => router.push(`/?station=${encodeURIComponent(s)}`)}
                        title={`Plan a trip from ${s}`}
                        style={{ "--k": i } as React.CSSProperties}
                      >
                        <i style={{ background: interchange ? "#fff" : l.color }} />
                        {s}
                        {interchange && (
                          <span className="metro-stop-tag">
                            {STATIONS[s]
                              .filter((k) => k !== l.key)
                              .map((k) => METRO_LINES.find((m) => m.key === k)?.name ?? k)
                              .join(" · ")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
