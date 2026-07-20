"use client";

import Link from "next/link";
import { useFeeds } from "@/lib/feeds";
import { useLang, type TKey } from "@/lib/i18n";

const LETTERS: { ch: string; w: TKey; b: TKey; href: string }[] = [
  { ch: "N", w: "about_l1_w", b: "about_l1_b", href: "/weather#regions" },
  { ch: "E", w: "about_l2_w", b: "about_l2_b", href: "/events" },
  { ch: "T", w: "about_l3_w", b: "about_l3_b", href: "/transport" },
  { ch: "R", w: "about_l4_w", b: "about_l4_b", href: "/weather#hourly" },
  { ch: "A", w: "about_l5_w", b: "about_l5_b", href: "/weather#air" },
];

const FEATURES: { icon: string; t: TKey; b: TKey }[] = [
  { icon: "☀️", t: "about_f1_t", b: "about_f1_b" },
  { icon: "🧭", t: "about_f2_t", b: "about_f2_b" },
  { icon: "🚌", t: "about_f3_t", b: "about_f3_b" },
  { icon: "🚇", t: "about_f4_t", b: "about_f4_b" },
  { icon: "🌫️", t: "about_f5_t", b: "about_f5_b" },
  { icon: "🎫", t: "about_f6_t", b: "about_f6_b" },
];

function EyeLogo({ size }: { size: number }) {
  return (
    <svg
      className="about-eye"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ng-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ea8fe" />
          <stop offset="100%" stopColor="#7ce0c3" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="108" fill="#0b1020" />
      <path d="M256 96 L256 62" stroke="#f5c518" strokeWidth="16" strokeLinecap="round" />
      <path d="M172 120 L150 94" stroke="#f5c518" strokeWidth="16" strokeLinecap="round" />
      <path d="M340 120 L362 94" stroke="#f5c518" strokeWidth="16" strokeLinecap="round" />
      <path
        d="M70 256 Q256 124 442 256 Q256 388 70 256 Z"
        fill="none"
        stroke="url(#ng-a)"
        strokeWidth="22"
        strokeLinejoin="round"
      />
      <circle cx="256" cy="256" r="88" fill="#0e1730" stroke="url(#ng-a)" strokeWidth="10" />
      <circle cx="256" cy="256" r="58" fill="none" stroke="#28406e" strokeWidth="4" />
      <circle cx="256" cy="256" r="30" fill="none" stroke="#28406e" strokeWidth="4" />
      <g className="eye-sweep">
        <path d="M256 256 L256 168 A88 88 0 0 1 331 212 Z" fill="#7ce0c3" opacity="0.35" />
        <line x1="256" y1="256" x2="331" y2="212" stroke="#7ce0c3" strokeWidth="8" strokeLinecap="round" />
      </g>
      <circle className="eye-blip" cx="225" cy="293" r="11" fill="#f5c518" />
      <circle className="eye-blip" cx="301" cy="241" r="9" fill="#e8467c" style={{ animationDelay: "0.8s" }} />
      <circle className="eye-blip" cx="236" cy="224" r="7" fill="#6ea8fe" style={{ animationDelay: "1.6s" }} />
      <circle cx="256" cy="256" r="10" fill="#eef1fb" />
    </svg>
  );
}

export function AboutContent() {
  const { t } = useLang();
  const feeds = useFeeds();

  const buses = feeds.transit.data?.data.stats.total ?? null;
  const aqi = feeds.air.data?.data.usAqi ?? null;
  const aqiCat = feeds.air.data?.data.category ?? "";
  const events = feeds.events.data?.data.total ?? null;
  const feels = feeds.weather.data?.data.apparent ?? null;

  const stats: { v: string; k: TKey; live: boolean }[] = [
    {
      v: buses !== null ? buses.toLocaleString("en-IN") : "—",
      k: "about_stat_buses",
      live: feeds.transit.data?.status === "live",
    },
    { v: aqi !== null ? `${aqi}` : "—", k: "about_stat_aqi", live: feeds.air.data?.status === "live" },
    {
      v: events !== null ? `${events}` : "—",
      k: "about_stat_events",
      live: feeds.events.data?.status === "live",
    },
    {
      v: feels !== null ? `${Math.round(feels)}°` : "—",
      k: "about_stat_temp",
      live: feeds.weather.data?.status === "live",
    },
  ];

  return (
    <>
      <section className="panel col-full about-hero">
        <div className="fx-parallax" data-speed="0.08">
          <EyeLogo size={96} />
        </div>
        <h2 className="about-title">NETRA</h2>
        <p className="about-tag">
          नेत्र <span className="about-tag-dim">·</span> {t("about_tag")}
        </p>
        <div className="about-acronym" aria-hidden="true">
          {LETTERS.map((l) => (
            <div className="aw" key={l.ch}>
              <span className="aw-ch">{l.ch}</span>
              <span className="aw-word">{t(l.w)}</span>
            </div>
          ))}
        </div>
        <p className="about-lead">{t("about_lead")}</p>
        <div className="about-actions">
          <Link href="/home" className="about-cta">
            {t("about_cta")}
          </Link>
          <div className="about-quick">
            <Link href="/weather">🌦️ {t("nav_weather")}</Link>
            <Link href="/transport">🚇 {t("nav_transport")}</Link>
            <Link href="/events">🎫 {t("nav_events")}</Link>
          </div>
        </div>
        <div className="about-live-h">{t("about_live_h")}</div>
        <div className="about-stats" aria-label={t("about_live_h")}>
          {stats.map((s) => (
            <div className="about-stat" key={s.k}>
              <b>{s.v}</b>
              <span>
                {s.live && <i className="live-dot" aria-hidden="true" />}
                {t(s.k)}
                {s.k === "about_stat_aqi" && aqiCat ? ` · ${aqiCat}` : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel col-full about-section">
        <h3>{t("about_why_h")}</h3>
        <p>{t("about_why_p")}</p>
        <div className="letter-grid">
          {LETTERS.map((l) => (
            <Link key={l.ch} href={l.href} className="letter-card">
              <span className="lc-ch">{l.ch}</span>
              <b>{t(l.w)}</b>
              <p>{t(l.b)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel col-full about-section">
        <h3>{t("about_what_h")}</h3>
        <p>{t("about_what_p")}</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.t}>
              <span className="fc-ic">{f.icon}</span>
              <b>{t(f.t)}</b>
              <p>{t(f.b)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel col-full about-section">
        <h3>{t("about_honest_h")}</h3>
        <p style={{ marginBottom: 0 }}>{t("about_honest_p")}</p>
      </section>

      <section className="panel col-full about-end">
        <EyeLogo size={56} />
        <div>
          <Link href="/home" className="about-cta">
            {t("about_cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
