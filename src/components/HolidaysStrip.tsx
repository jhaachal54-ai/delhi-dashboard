"use client";

import { daysUntil, holidayLabel, upcomingHolidays } from "@/lib/holidays";
import { Panel } from "./Panel";

export function HolidaysStrip() {
  const list = upcomingHolidays();
  return (
    <Panel title="Festivals & Holidays" icon="🎆" source="What's coming up in Delhi">
      <div className="holiday-list">
        {list.map((h) => {
          const dd = daysUntil(h.date);
          const when = dd === 0 ? "Today" : dd === 1 ? "Tomorrow" : `in ${dd} days`;
          return (
            <div className="holiday-row" key={h.date}>
              <span className="holiday-ic">{h.emoji}</span>
              <div className="holiday-text">
                <b>
                  {h.name} <span className="holiday-when">· {holidayLabel(h.date)} ({when})</span>
                </b>
                <span>{h.note}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
