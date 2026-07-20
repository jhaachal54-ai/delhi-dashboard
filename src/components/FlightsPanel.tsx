"use client";

import { REFRESH } from "@/lib/config";
import type { FlightsData } from "@/lib/types";
import { usePolling } from "@/lib/usePolling";
import { Panel } from "./Panel";

function statusTone(s: string): string {
  const t = s.toLowerCase();
  if (t.includes("delay") || t.includes("cancel")) return "bad";
  if (t.includes("board") || t.includes("landed")) return "good";
  return "";
}

export function FlightsPanel() {
  const { data } = usePolling<FlightsData>("/api/flights", REFRESH.flights);
  const d = data?.data;

  const col = (title: string, list: FlightsData["arrivals"], other: string) => (
    <div className="analytics-col">
      <div className="analytics-h">{title}</div>
      <div className="flight-list">
        {list.map((f, i) => (
          <div className="flight-row" key={`${f.flight}-${i}`}>
            <span className="flight-time">{f.time}</span>
            <span className="flight-main">
              <b>{f.flight}</b> · {f.city}
              <span className="flight-sub">
                {f.airline}
                {f.terminal ? ` · ${f.terminal}` : ""}
              </span>
            </span>
            <span className={`flight-status ${statusTone(f.status)}`}>{f.status}</span>
          </div>
        ))}
        {list.length === 0 && <div className="hint">No {other} in the window.</div>}
      </div>
    </div>
  );

  return (
    <Panel
      title="IGI Airport"
      icon="✈️"
      source={data?.source ?? "AeroDataBox · IGI (DEL)"}
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {!data && <div className="spinner" />}
      {data?.note && <div className="note">{data.note}</div>}
      {d && (
        <div className="analytics-grid">
          {col("Arrivals", d.arrivals, "arrivals")}
          {col("Departures", d.departures, "departures")}
        </div>
      )}
    </Panel>
  );
}
