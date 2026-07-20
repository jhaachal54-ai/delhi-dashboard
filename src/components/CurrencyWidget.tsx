"use client";

import { REFRESH } from "@/lib/config";
import type { RatesData } from "@/lib/types";
import { usePolling } from "@/lib/usePolling";
import { Panel } from "./Panel";

export function CurrencyWidget() {
  const { data } = usePolling<RatesData>("/api/rates", REFRESH.rates);
  const d = data?.data;
  const rows: [string, string, number | null][] = [
    ["🇺🇸", "1 US Dollar", d?.perUsd ?? null],
    ["🇪🇺", "1 Euro", d?.perEur ?? null],
    ["🇬🇧", "1 Pound", d?.perGbp ?? null],
  ];
  return (
    <Panel
      title="Money for Tourists"
      icon="💱"
      source={data?.source ?? "Live exchange rates"}
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {data?.note && <div className="note">{data.note}</div>}
      <div className="rate-list">
        {rows.map(([flag, label, val]) => (
          <div className="rate-row" key={label}>
            <span className="rate-cur">
              {flag} {label}
            </span>
            <b className="rate-val">{val != null ? `₹${val.toLocaleString("en-IN")}` : "—"}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}
