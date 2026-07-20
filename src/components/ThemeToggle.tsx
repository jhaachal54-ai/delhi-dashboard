"use client";

import { useEffect, useRef, useState } from "react";
import { useFeeds } from "@/lib/feeds";

type Theme = "dark" | "light";

// Is it daytime in Delhi right now? Rough fallback used only until the weather
// feed (which carries an authoritative isDay flag) arrives.
function istIsDay(): boolean {
  const hhmm = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const h = Number(hhmm.slice(0, 2));
  return h >= 6 && h < 19;
}

export function ThemeToggle() {
  const { weather } = useFeeds();
  const [theme, setTheme] = useState<Theme>("dark");
  // True once the user has explicitly chosen — their choice then wins over the
  // automatic day/night default for the rest of the session.
  const manual = useRef(false);

  const apply = (t: Theme) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "dark" || saved === "light") {
      manual.current = true;
      apply(saved);
    } else {
      apply(istIsDay() ? "light" : "dark");
    }
  }, []);

  // Once real sunrise/sunset-derived daylight is known, follow it — unless the
  // user has taken manual control.
  const isDay = weather.data?.data.isDay;
  useEffect(() => {
    if (manual.current || isDay == null) return;
    apply(isDay ? "light" : "dark");
  }, [isDay]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    manual.current = true;
    apply(next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      className="theme-btn"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
