"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATION_NAMES } from "@/lib/metroRouting";
import { PLACES } from "@/lib/places";

interface Cmd {
  label: string;
  sub: string;
  href: string;
  icon: string;
}

const PAGES: Cmd[] = [
  { label: "About", sub: "Page", href: "/", icon: "👁️" },
  { label: "Home · Should I head out?", sub: "Page", href: "/home", icon: "🏠" },
  { label: "Weather & Air", sub: "Page", href: "/weather", icon: "🌦️" },
  { label: "Events & Food", sub: "Page", href: "/events", icon: "🎫" },
  { label: "Transport", sub: "Page", href: "/transport", icon: "🚇" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const all = useMemo<Cmd[]>(
    () => [
      ...PAGES,
      ...PLACES.map((p) => ({
        label: p.name,
        sub: "Place · plan a visit",
        href: `/home?place=${p.key}`,
        icon: p.emoji,
      })),
      ...STATION_NAMES.map((s) => ({
        label: s,
        sub: "Metro station",
        href: `/home?station=${encodeURIComponent(s)}`,
        icon: "🚇",
      })),
    ],
    []
  );

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return PAGES;
    return all.filter((c) => c.label.toLowerCase().includes(term)).slice(0, 8);
  }, [q, all]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const go = (c: Cmd | undefined) => {
    if (!c) return;
    setOpen(false);
    router.push(c.href);
  };

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk" role="dialog" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Search places, metro stations, pages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[sel]);
            }
          }}
        />
        <div className="cmdk-list">
          {results.length === 0 && <div className="cmdk-empty">No matches</div>}
          {results.map((c, i) => (
            <button
              key={`${c.href}-${i}`}
              className={`cmdk-item ${i === sel ? "on" : ""}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(c)}
            >
              <span className="cmdk-ic">{c.icon}</span>
              <span className="cmdk-label">{c.label}</span>
              <span className="cmdk-sub">{c.sub}</span>
            </button>
          ))}
        </div>
        <div className="cmdk-hint">↑↓ to move · ↵ to open · Esc to close</div>
      </div>
    </div>
  );
}
