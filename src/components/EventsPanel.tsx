"use client";

import { useMemo, useState } from "react";
import { useFeeds } from "@/lib/feeds";
import { Panel } from "./Panel";

function segmentEmoji(seg: string | null): string {
  switch (seg) {
    case "Music":
      return "🎵";
    case "Comedy":
      return "🎤";
    case "Nightlife":
      return "🪩";
    case "Sports":
      return "🏟️";
    case "Theatre":
      return "🎭";
    case "Arts":
      return "🎨";
    case "Tech":
      return "💻";
    case "Food":
      return "🍽️";
    case "Festival":
      return "🎪";
    case "Dating":
      return "💘";
    case "Kids":
      return "🧸";
    default:
      return "🎫";
  }
}

export function EventsPanel() {
  const { data, loading } = useFeeds().events;
  const env = data;
  const d = env?.data;
  const [genre, setGenre] = useState<string | null>(null);

  // Genres present in the current live batch, biggest first.
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of d?.events ?? []) {
      if (e.segment) counts.set(e.segment, (counts.get(e.segment) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [d]);

  const shown = (d?.events ?? []).filter((e) => !genre || e.segment === genre);

  return (
    <Panel
      title="Local Events"
      icon="🎫"
      source={env?.source ?? "Real-Time Events Search (RapidAPI)"}
      status={env?.status ?? null}
      updated={env ? new Date(env.fetchedAt) : null}
    >
      {loading && !env && (
        <>
          <div className="skeleton sk-block" style={{ height: 74 }} />
          <div className="skeleton sk-block" style={{ height: 74 }} />
          <div className="skeleton sk-block" style={{ height: 74 }} />
        </>
      )}
      {env?.note && <div className="note">{env.note}</div>}

      {d && d.events.length === 0 && !env?.note && (
        <div className="empty">No upcoming events found right now.</div>
      )}

      {genres.length > 1 && (
        <div className="genre-chips">
          <button className={`gchip ${genre === null ? "on" : ""}`} onClick={() => setGenre(null)}>
            All ({d?.events.length ?? 0})
          </button>
          {genres.map(([g, n]) => (
            <button
              key={g}
              className={`gchip ${genre === g ? "on" : ""}`}
              onClick={() => setGenre(genre === g ? null : g)}
            >
              {segmentEmoji(g)} {g} ({n})
            </button>
          ))}
        </div>
      )}

      {d && d.events.length > 0 && shown.length === 0 && (
        <div className="empty">No {genre} events in this batch.</div>
      )}

      {shown.length > 0 && (
        <div className="events">
          {shown.map((e, idx) => {
            const Wrapper: any = e.url ? "a" : "div";
            return (
              <Wrapper
                key={e.id}
                className="event"
                style={{ "--j": idx } as React.CSSProperties}
                {...(e.url ? { href: e.url, target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {e.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="thumb" src={e.image} alt="" loading="lazy" />
                ) : (
                  <div className="thumb ph">{segmentEmoji(e.segment)}</div>
                )}
                <div className="info">
                  <div className="name">
                    {e.name}
                    {e.segment && <span className="tag">{e.segment}</span>}
                  </div>
                  <div className="meta">
                    {e.dateLabel}
                    {e.venue ? ` · ${e.venue}` : ""}
                  </div>
                </div>
                {e.priceLabel && <div className="price">{e.priceLabel}</div>}
              </Wrapper>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
