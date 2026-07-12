"use client";

import { useFeeds } from "@/lib/feeds";
import { useLang } from "@/lib/i18n";
import { computeHeadOut } from "@/lib/score";
import { useCountUp } from "@/lib/useCountUp";

const R = 62;
const C = 2 * Math.PI * R;

export function HeadOutPanel() {
  const { t } = useLang();
  const { air, weather, events } = useFeeds();
  const s = computeHeadOut(air.data?.data ?? null, weather.data?.data ?? null, events.data?.data ?? null);
  const animated = useCountUp(s.ready ? s.score : null);
  const offset = C * (1 - (s.ready ? s.score : 0) / 100);

  return (
    <section className="hero" style={{ "--glow": s.color } as React.CSSProperties}>
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
