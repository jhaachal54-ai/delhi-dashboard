"use client";

import { useEffect, useState } from "react";
import { useFeeds } from "@/lib/feeds";
import { haversineKm } from "@/lib/geo";
import { useLang } from "@/lib/i18n";
import { computeHeadOut } from "@/lib/score";
import { useCountUp } from "@/lib/useCountUp";
import { Confetti } from "./Confetti";
import { ShareScore } from "./ShareScore";

const R = 62;
const C = 2 * Math.PI * R;

export function HeadOutPanel() {
  const { t } = useLang();
  const { air, weather, events, regions } = useFeeds();

  // The user's last known location (set by the planner's "Near me"), used to
  // score the air where they actually are rather than the city default.
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("userLoc");
      if (saved) setLoc(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    const onLoc = (e: Event) => setLoc((e as CustomEvent<{ lat: number; lng: number }>).detail);
    window.addEventListener("netra-loc", onLoc);
    return () => window.removeEventListener("netra-loc", onLoc);
  }, []);

  // Nearest NCR region with a live AQI reading.
  const nearestRegion = (() => {
    const list = regions.data?.data.regions ?? [];
    if (!loc || list.length === 0) return null;
    let best: (typeof list)[number] | null = null;
    let bestKm = Infinity;
    for (const r of list) {
      if (r.usAqi == null) continue;
      const km = haversineKm(loc.lat, loc.lng, r.lat, r.lng);
      if (km < bestKm) {
        bestKm = km;
        best = r;
      }
    }
    return best;
  })();

  const s = computeHeadOut(
    air.data?.data ?? null,
    weather.data?.data ?? null,
    events.data?.data ?? null,
    nearestRegion
      ? { aqiOverride: nearestRegion.usAqi, aqiLabel: nearestRegion.name }
      : {}
  );
  const animated = useCountUp(s.ready ? s.score : null);
  const offset = C * (1 - (s.ready ? s.score : 0) / 100);

  // Weather-reactive backdrop: rain streaks, smog haze, sunny glow, or clouds.
  const wx = weather.data?.data;
  const aqi = air.data?.data.usAqi ?? null;
  const condition =
    wx?.precipitation && wx.precipitation > 0
      ? "rain"
      : wx?.code != null && wx.code >= 51
        ? "rain"
        : aqi != null && aqi > 200
          ? "haze"
          : wx?.code != null && wx.code <= 1 && wx.isDay
            ? "clear"
            : "cloud";

  return (
    <section
      className={`hero hero-wx-${condition}`}
      style={{ "--glow": s.color } as React.CSSProperties}
    >
      <div className="hero-wx" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {s.ready && s.score >= 80 && <Confetti />}
      <div className="hero-ring">
        <svg viewBox="0 0 148 148">
          <circle className="arc-bg" cx="74" cy="74" r={R} strokeWidth="12" />
          <circle
            className="arc-fg"
            cx="74"
            cy="74"
            r={R}
            strokeWidth="12"
            stroke={s.color}
            style={{ color: s.color, strokeDasharray: C, strokeDashoffset: offset }}
          />
        </svg>
        <div className="hero-ring-center">
          <div className="hero-score" style={{ color: s.color }}>
            {s.ready ? Math.round(animated) : "–"}
          </div>
          <div className="hero-score-lbl">/ 100</div>
        </div>
      </div>

      <div className="hero-body">
        <div className="hero-kicker">{t("hero_kicker")}</div>
        <div className="hero-verdict" style={{ "--vc": s.color } as React.CSSProperties}>
          {s.ready ? s.verdict : "Reading the city…"}
        </div>
        <div className="hero-sub">
          Live composite for Delhi — air quality, how hot it feels, rain &amp; what&apos;s on tonight
        </div>
        {s.ready && <div className="hero-cta">{s.cta}</div>}
        {s.ready && s.outlook && <div className="hero-outlook">🔮 {s.outlook}</div>}
        {s.ready && (
          <div className="hero-share">
            <ShareScore score={s} />
          </div>
        )}

        {s.ready && (
          <div className="hero-reasons">
            {s.reasons.map((r, i) => (
              <span key={i} className={`chip ${r.tone}`}>
                <span className="chip-ic">{r.icon}</span>
                {r.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
