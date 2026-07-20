"use client";

import { REFRESH } from "@/lib/config";
import { newsThumb } from "@/lib/thumbs";
import type { NewsData } from "@/lib/types";
import { usePolling } from "@/lib/usePolling";
import { Panel } from "./Panel";

function ago(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 0) return "";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function NewsPanel() {
  const { data } = usePolling<NewsData>("/api/news", REFRESH.news);
  const items = data?.data.items ?? [];

  return (
    <Panel
      title="City Pulse"
      icon="📰"
      source={data?.source ?? "Delhi headlines"}
      status={data?.status ?? null}
      updated={data ? new Date(data.fetchedAt) : null}
    >
      {!data && <div className="spinner" />}
      {data?.note && <div className="note">{data.note}</div>}
      <div className="news-list">
        {items.map((n, i) => {
          const fallback = newsThumb(n.source);
          const inner = (
            <>
              <img
                className="news-thumb"
                src={n.image ?? fallback}
                alt=""
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== fallback) img.src = fallback;
                }}
              />
              <div className="news-text">
                <span className="news-title">{n.title}</span>
                <span className="news-meta">
                  {n.source}
                  {ago(n.publishedAt) ? ` · ${ago(n.publishedAt)}` : ""}
                </span>
              </div>
            </>
          );
          return n.url ? (
            <a key={i} className="news-row" href={n.url} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <div key={i} className="news-row">
              {inner}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
