"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, type TKey } from "@/lib/i18n";
import { Clock } from "./Clock";
import { ThemeToggle } from "./ThemeToggle";

const LINKS: { href: string; k: TKey; icon: string }[] = [
  { href: "/", k: "nav_about", icon: "👁️" },
  { href: "/home", k: "nav_home", icon: "🏠" },
  { href: "/weather", k: "nav_weather", icon: "🌦️" },
  { href: "/events", k: "nav_events", icon: "🎫" },
  { href: "/transport", k: "nav_transport", icon: "🚇" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();

  return (
    <header className="header">
      <div className="brand">
        <h1>
          <span className="logo">
            <svg width="30" height="30" viewBox="0 0 72 72" aria-hidden="true">
              <defs>
                <linearGradient id="ng-h" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6ea8fe" />
                  <stop offset="100%" stopColor="#7ce0c3" />
                </linearGradient>
              </defs>
              <rect width="72" height="72" rx="16" fill="#0b1020" />
              <path d="M36 13 L36 8.5" stroke="#f5c518" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M24 16.5 L21 13" stroke="#f5c518" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M48 16.5 L51 13" stroke="#f5c518" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 36 Q36 17.5 62 36 Q36 54.5 10 36 Z" fill="none" stroke="url(#ng-h)" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="36" cy="36" r="12.5" fill="#0e1730" stroke="url(#ng-h)" strokeWidth="1.5" />
              <circle cx="36" cy="36" r="8" fill="none" stroke="#28406e" strokeWidth="1" />
              <path d="M36 36 L36 23.5 A12.5 12.5 0 0 1 46.6 29.8 Z" fill="#7ce0c3" opacity="0.35" />
              <line x1="36" y1="36" x2="46.6" y2="29.8" stroke="#7ce0c3" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="31.5" cy="41.2" r="1.8" fill="#f5c518" />
              <circle cx="42.4" cy="33.8" r="1.5" fill="#e8467c" />
              <circle cx="36" cy="36" r="1.6" fill="#eef1fb" />
            </svg>
          </span>{" "}
          NETRA
        </h1>
        <div className="sub">{t("brand_sub")}</div>
      </div>
      <Clock />
      <nav className="nav" aria-label="Pages">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`navlink ${pathname === l.href ? "active" : ""}`}
          >
            <span className="navlink-ic">{l.icon}</span>
            {t(l.k)}
          </Link>
        ))}
        <button
          className="theme-btn"
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          aria-label="Switch language"
          title={lang === "en" ? "हिन्दी में देखें" : "View in English"}
        >
          {lang === "en" ? "हिं" : "EN"}
        </button>
        <ThemeToggle />
      </nav>
    </header>
  );
}
