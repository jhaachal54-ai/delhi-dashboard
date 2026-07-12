"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, type TKey } from "@/lib/i18n";
import { Clock } from "./Clock";
import { ThemeToggle } from "./ThemeToggle";

const LINKS: { href: string; k: TKey; icon: string }[] = [
  { href: "/", k: "nav_home", icon: "🏠" },
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
          <span className="logo">🛺</span> Delhi City Dashboard
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
