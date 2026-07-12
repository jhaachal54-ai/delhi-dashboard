"use client";

import { useEffect, useState } from "react";

// Live IST clock. Renders nothing until mounted to avoid a server/client
// hydration mismatch on the time string.
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="clock" style={{ minHeight: 46 }} />;

  return (
    <div className="clock">
      <div className="time">
        {now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })}
      </div>
      <div className="date">
        {now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Asia/Kolkata",
        })}{" "}
        · IST
      </div>
    </div>
  );
}
