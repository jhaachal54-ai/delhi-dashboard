"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, type TKey } from "@/lib/i18n";

const LINKS: { href: string; k: TKey; icon: string }[] = [
  { href: "/", k: "nav_about", icon: "👁️" },
  { href: "/home", k: "nav_home", icon: "🏠" },
  { href: "/weather", k: "nav_weather", icon: "🌦️" },
  { href: "/events", k: "nav_events", icon: "🎫" },
  { href: "/transport", k: "nav_transport", icon: "🚇" },
];

// Thumb-reachable tab bar, shown only on small screens (CSS-gated).
export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLang();
  return (
    <nav className="bottom-nav" aria-label="Pages">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`bottom-nav-link ${pathname === l.href ? "active" : ""}`}
        >
          <span className="bn-icon">{l.icon}</span>
          <span className="bn-label">{t(l.k)}</span>
        </Link>
      ))}
    </nav>
  );
}
