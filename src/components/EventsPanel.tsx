"use client";

import { useMemo, useState } from "react";
import { useFeeds } from "@/lib/feeds";
import type { EventItem } from "@/lib/types";
import { Panel } from "./Panel";

type DateFilter = "all" | "today" | "tomorrow" | "weekend";

// IST calendar date (yyyy-mm-dd) for a Date, and day-of-week (0=Sun).
function istDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}
function istDow(d: Date): number {
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay();
}

function matchesDate(e: EventItem, f: DateFilter): boolean {
  if (f === "all") return true;
  if (!e.date) return false;
  const d = new Date(e.date);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const today = istDate(now);
  const tomorrow = istDate(new Date(now.getTime() + 86400_000));
  const ed = istDate(d);
  if (f === "today") return ed === today;
  if (f === "tomorrow") return ed === tomorrow;
  // weekend: upcoming Sat/Sun within the next 7 days
  const dow = istDow(d);
  const withinWeek = d.getTime() - now.getTime() < 7 * 86400_000 && d.getTime() > now.getTime() - 86400_000;
  return (dow === 0 || dow === 6) && withinWeek;
}

// Build and download an .ics calendar file for an event (2h default duration).
function downloadIcs(e: EventItem) {
  if (!e.date) return;
  const start = new Date(e.date);
  const end = new Date(start.getTime() + 2 * 3600_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Delhi City Dashboard//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@delhi-dashboard`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(e.name)}`,
    e.venue ? `LOCATION:${esc(e.venue)}` : "",
    e.url ? `URL:${e.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${e.name.slice(0, 40).replace(/[^\w ]/g, "")}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

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
  const [dateF, setDateF] = useState<DateFilter>("all");

  // Genres present in the current live batch, biggest first.
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of d?.events ?? []) {
      if (e.segment) counts.set(e.segment, (counts.get(e.segment) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [d]);

  const shown = (d?.events ?? []).filter(
    (e) => (!genre || e.segment === genre) && matchesDate(e, dateF)
  );

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

      {d && d.events.length > 0 && (
        <div className="genre-chips">
          {(
            [
              ["all", "All dates"],
              ["today", "Today"],
              ["tomorrow", "Tomorrow"],
              ["weekend", "Weekend"],
            ] as [DateFilter, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              className={`gchip ${dateF === k ? "on" : ""}`}
              onClick={() => setDateF(k)}
            >
              {label}
            </button>
          ))}
        </div>
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
        <div className="empty">
          No {genre ?? ""} events {dateF !== "all" ? `for ${dateF}` : "in this batch"}.
        </div>
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
                {e.date && (
                  <button
                    className="ics-btn"
                    title="Add to calendar"
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      downloadIcs(e);
                    }}
                  >
                    📅
                  </button>
                )}
              </Wrapper>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
