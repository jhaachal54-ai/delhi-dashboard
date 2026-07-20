"use client";

import { REFRESH } from "@/lib/config";
import type { TrainsData } from "@/lib/types";
import { usePolling } from "@/lib/usePolling";
import { Panel } from "./Panel";

export function TrainsPanel() {
  const { data } = usePolling<TrainsData>("/api/trains", REFRESH.trains);
  const d = data?.data;

  return (
    <Panel
      title="New Delhi Departures"
      icon="🚆"
      source={data?.source ?? "IRCTC · New Delhi (NDLS)"}
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {!data && <div className="spinner" />}
      {data?.note && <div className="note">{data.note}</div>}
      {d && (
        <div className="train-list">
          {d.trains.map((t, i) => {
            const delayed = t.status.toLowerCase().includes("delay");
            return (
              <div className="train-row" key={`${t.number}-${i}`}>
                <span className="train-time">{t.departs}</span>
                <span className="train-main">
                  <b>{t.name}</b>
                  <span className="train-sub">
                    {t.number} → {t.to}
                  </span>
                </span>
                {t.platform && <span className="train-pf">PF {t.platform}</span>}
                <span className={`flight-status ${delayed ? "bad" : "good"}`}>{t.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
