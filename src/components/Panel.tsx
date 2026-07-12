"use client";

import type { DataStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: DataStatus | null }) {
  if (!status) return null;
  const label = status === "live" ? "Live" : status === "sample" ? "Sample" : "Error";
  return (
    <span className={`badge ${status}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function Panel({
  title,
  icon,
  source,
  status,
  updated,
  children,
}: {
  title: string;
  icon: string;
  source?: string;
  status?: DataStatus | null;
  updated?: Date | null;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">
            <span className="ic">{icon}</span>
            {title}
          </div>
          {source && <div className="panel-src">{source}</div>}
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
          <StatusBadge status={status ?? null} />
          {updated && (
            <span className="updated">
              {updated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Kolkata",
              })}
            </span>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
