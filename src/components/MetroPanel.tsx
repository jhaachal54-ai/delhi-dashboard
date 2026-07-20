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
                <div className="metro-timeline" style={{ "--line-color": l.color } as React.CSSProperties}>
                  {stops.map((s, i) => {
                    const lines = STATIONS[s] ?? [];
                    const interchange = lines.length > 1;
                    // A station counts as open if any line serving it is running.
                    const openNow =
                      nowMin != null &&
                      lines.some((k) => {
                        const line = METRO_LINES.find((m) => m.key === k);
                        return line ? lineStatus(line, nowMin).running : false;
                      });
                    const others = lines
                      .filter((k) => k !== l.key)
                      .map((k) => METRO_LINES.find((m) => m.key === k)?.name ?? k)
                      .join(", ");
                    return (
                      <button
                        key={s}
                        className="tl-row"
                        onClick={() => router.push(`/home?station=${encodeURIComponent(s)}`)}
                        title={`Plan a trip from ${s}${interchange ? ` · interchange: ${others}` : ""}`}
                        style={{ "--k": i } as React.CSSProperties}
                      >
                        <span className={`tl-dot ${interchange ? "ix" : ""}`} />
                        <span className="tl-name">{s}</span>
                        {interchange && (
                          <span className="tl-ix" aria-label={`Interchange with ${others}`}>
                            ⇄
                          </span>
                        )}
                        <span className={`tl-status ${openNow ? "open" : "closed"}`}>
                          {openNow ? "Open" : "Closed"}
                        </span>
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
