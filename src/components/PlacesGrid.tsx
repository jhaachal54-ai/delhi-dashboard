"use client";

import images from "@/data/placeImages.json";
import { useLang } from "@/lib/i18n";
import { METRO_LINES } from "@/lib/metro";
import { PLACES } from "@/lib/places";

const IMAGES = images as Record<string, string>;

const LINE_BY_KEY = new Map(METRO_LINES.map((l) => [l.key, l]));

// Curated grid of Delhi's famous tourist places. Clicking a card scrolls up to
// the planner with that place pre-selected.
export function PlacesGrid() {
  const { t } = useLang();
  const plan = (key: string) => {
    window.dispatchEvent(new CustomEvent("plan-place", { detail: key }));
  };

  return (
    <section>
      <h2 className="section-h">
        <span>🗺️</span> {t("places_h")}
        <span className="section-hint">{t("places_hint")}</span>
      </h2>
      <div className="place-grid">
        {PLACES.map((p, i) => (
          <button
            className="place-card"
            key={p.key}
            style={{ "--i": i % 6 } as React.CSSProperties}
            onClick={() => plan(p.key)}
            aria-label={`Plan a visit to ${p.name}`}
          >
            {IMAGES[p.key] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="place-photo" src={IMAGES[p.key]} alt={p.name} loading="lazy" />
            )}
            <div className="place-head">
              <span className="place-emoji">{p.emoji}</span>
              <div>
                <div className="place-name">{p.name}</div>
                <div className="place-blurb">{p.blurb}</div>
              </div>
            </div>
            <div className="place-metro">
              🚇 <b>{p.station}</b>
              <span className="line-dots">
                {p.lineKeys.map((k) => {
                  const line = LINE_BY_KEY.get(k);
                  return (
                    <i
                      key={k}
                      className="line-dot"
                      style={{ background: line?.color ?? "#888" }}
                      title={line ? `${line.name} Line` : k}
                    />
                  );
                })}
              </span>
            </div>
            <div className="place-food">
              {p.restaurants.slice(0, 2).map((r) => (
                <div className="place-food-row" key={r.name}>
                  🍽️ <b>{r.name}</b> — {r.knownFor}
                </div>
              ))}
            </div>
            <div className="place-plan">Plan this visit ↑</div>
          </button>
        ))}
      </div>
    </section>
  );
}
