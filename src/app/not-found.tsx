import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — NETRA",
};

export default function NotFound() {
  return (
    <section className="panel col-full about-hero">
      <svg width="88" height="88" viewBox="0 0 512 512" aria-hidden="true" style={{ borderRadius: 20 }}>
        <defs>
          <linearGradient id="ng-404" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ea8fe" />
            <stop offset="100%" stopColor="#7ce0c3" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="108" fill="#0b1020" />
        <path
          d="M70 256 Q256 124 442 256 Q256 388 70 256 Z"
          fill="none"
          stroke="url(#ng-404)"
          strokeWidth="22"
          strokeLinejoin="round"
        />
        {/* closed / crossed-out iris — the eye can't see this page */}
        <line x1="196" y1="196" x2="316" y2="316" stroke="#e8467c" strokeWidth="18" strokeLinecap="round" />
        <circle cx="256" cy="256" r="58" fill="none" stroke="#28406e" strokeWidth="8" />
      </svg>
      <h2 className="about-title" style={{ fontSize: 34 }}>
        404
      </h2>
      <p className="about-tag">The eye can’t see this page</p>
      <p className="about-lead">
        That address isn’t part of NETRA — it may have moved, or never existed. Head back to the
        dashboard and carry on watching the city.
      </p>
      <Link href="/" className="about-cta">
        Back to NETRA →
      </Link>
    </section>
  );
}
