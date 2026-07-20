"use client";

import { useEffect, useMemo, useState } from "react";
import { BUS_HUBS, HUB_BY_KEY } from "@/lib/busHubs";
import { useFeeds } from "@/lib/feeds";
import { haversineKm } from "@/lib/geo";
import { useLang } from "@/lib/i18n";
import { METRO_LINES } from "@/lib/metro";
import {
  journeyFareEstimate,
  nearestStation,
  planMetroRoute,
  routeStations,
  STATION_NAMES,
  totalJourneyMinutes,
} from "@/lib/metroRouting";
import { PLACES } from "@/lib/places";
import type { ApiEnvelope, BusConnectData, EventItem } from "@/lib/types";
import { Panel } from "./Panel";
import { RestaurantRow } from "./RestaurantRow";

const EVENT_RADIUS_KM = 7;

function lineDot(key: string) {
  const line = METRO_LINES.find((l) => l.key === key);
  return (
    <i
      key={key}
      className="line-dot"
      style={{ background: line?.color ?? "#888" }}
      title={line ? `${line.name} Line` : key}
    />
  );
}

function fmtIst(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function PlanVisit() {
  const { events } = useFeeds();
  const [placeKey, setPlaceKey] = useState("india-gate");
  const [station, setStation] = useState("");
  const [hubKey, setHubKey] = useState("");
  const [bus, setBus] = useState<ApiEnvelope<BusConnectData> | null>(null);
  const [busLoading, setBusLoading] = useState(false);
  const [locState, setLocState] = useState<"idle" | "locating" | "done" | "error">("idle");
  const [shared, setShared] = useState(false);
  const [returnTrip, setReturnTrip] = useState(false);
  const [nearStop, setNearStop] = useState<{ name: string; km: number } | null>(null);
  const [recents, setRecents] = useState<{ p: string; s: string; h: string }[]>([]);
  const { t } = useLang();

  useEffect(() => {
    try {
      setRecents(JSON.parse(localStorage.getItem("recentPlans") ?? "[]"));
    } catch {
      /* ignore */
    }
  }, []);

  const place = PLACES.find((p) => p.key === placeKey) ?? PLACES[0];

  // Prefill from ?station= / ?place= / ?hub= (shared links, metro map), and
  // listen for place-card clicks anywhere on the page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const st = params.get("station");
    const pl = params.get("place");
    const hb = params.get("hub");
    if (st && STATION_NAMES.includes(st)) setStation(st);
    if (pl && PLACES.some((p) => p.key === pl)) setPlaceKey(pl);
    if (hb && HUB_BY_KEY.has(hb)) setHubKey(hb);

    const onPlace = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (PLACES.some((p) => p.key === key)) {
        setPlaceKey(key);
        document.getElementById("planner")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("plan-place", onPlace);
    return () => window.removeEventListener("plan-place", onPlace);
  }, []);

  // Keep the URL in sync with the current plan so it can be shared as-is.
  useEffect(() => {
    const params = new URLSearchParams();
    if (placeKey) params.set("place", placeKey);
    if (station) params.set("station", station);
    if (hubKey) params.set("hub", hubKey);
    const qs = params.toString();
    const path = window.location.pathname;
    window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
  }, [placeKey, station, hubKey]);

  const sharePlan = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // Clipboard unavailable (e.g. http on another device) — show the URL.
      window.prompt("Copy this link:", window.location.href);
    }
  };

  // One tap: browser location -> nearest metro station + nearest bus hub.
  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocState("error");
      return;
    }
    setLocState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Share the fix so the "should I head out?" score can use the air
        // quality of the user's own region instead of the city default.
        try {
          localStorage.setItem("userLoc", JSON.stringify({ lat: latitude, lng: longitude }));
          window.dispatchEvent(
            new CustomEvent("netra-loc", { detail: { lat: latitude, lng: longitude } })
          );
        } catch {
          /* ignore */
        }
        const st = nearestStation(latitude, longitude);
        if (st) setStation(st.name);
        let bestHub = BUS_HUBS[0];
        let bestKm = Infinity;
        for (const h of BUS_HUBS) {
          const km = haversineKm(latitude, longitude, h.lat, h.lng);
          if (km < bestKm) {
            bestKm = km;
            bestHub = h;
          }
        }
        setHubKey(bestHub.key);
        setLocState("done");
        // Also look up the truly nearest bus stop (10.5k stops from the GTFS).
        fetch(`/api/nearest-stop?lat=${latitude}&lng=${longitude}`)
          .then((r) => r.json())
          .then((j) => setNearStop(j.stops?.[0] ?? null))
          .catch(() => setNearStop(null));
      },
      () => setLocState("error"),
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Metro plan is instant, client-side. Return trip swaps the endpoints.
  const segs = useMemo(
    () =>
      station
        ? returnTrip
          ? planMetroRoute(place.station, station)
          : planMetroRoute(station, place.station)
        : null,
    [station, place.station, returnTrip]
  );

  // Remember completed plans (for the "Recent" chips) and the outbound route's
  // station list (so the metro map on the Transport page can highlight it).
  useEffect(() => {
    if (!station || !placeKey) return;
    try {
      const entry = { p: placeKey, s: station, h: hubKey };
      const list = [entry, ...recents.filter((r) => !(r.p === entry.p && r.s === entry.s))].slice(0, 4);
      setRecents(list);
      localStorage.setItem("recentPlans", JSON.stringify(list));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station, placeKey, hubKey]);

  useEffect(() => {
    if (!segs || segs.length === 0 || returnTrip) return;
    try {
      localStorage.setItem(
        "lastMetroRoute",
        JSON.stringify({
          stations: routeStations(segs),
          from: station,
          to: place.station,
          ts: Date.now(),
        })
      );
    } catch {
      /* ignore */
    }
  }, [segs, station, place.station, returnTrip]);

  // Bus matching hits the live feed server-side.
  useEffect(() => {
    if (!hubKey) {
      setBus(null);
      return;
    }
    let cancelled = false;
    setBusLoading(true);
    fetch(`/api/bus-connect?hub=${hubKey}&place=${place.key}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setBus(j);
      })
      .catch(() => {
        if (!cancelled) setBus(null);
      })
      .finally(() => {
        if (!cancelled) setBusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hubKey, place.key]);

  // Events near the chosen place (venue coords come from the live feed).
  const nearbyEvents = useMemo(() => {
    const all: EventItem[] = events.data?.data.events ?? [];
    const withDist = all
      .filter((e) => e.lat != null && e.lng != null)
      .map((e) => ({ e, km: haversineKm(e.lat!, e.lng!, place.lat, place.lng) }))
      .filter((x) => x.km <= EVENT_RADIUS_KM)
      .sort((a, b) => a.km - b.km)
      .slice(0, 4);
    if (withDist.length > 0) return { items: withDist, citywide: false };
    return {
      items: all.slice(0, 3).map((e) => ({ e, km: null as number | null })),
      citywide: true,
    };
  }, [events.data, place]);

  return (
    <div id="planner">
    <Panel title={t("plan_title")} icon="🧭" source="Metro routing · live DTC buses · events & food nearby">
      <div className="plan-toolbar">
        <button className="near-btn" onClick={locateMe} disabled={locState === "locating"}>
          📍 {locState === "locating" ? t("locating") : t("near_me")}
        </button>
        <button className="near-btn" onClick={sharePlan}>
          🔗 {shared ? t("copied") : t("share_plan")}
        </button>
        {locState === "done" && (
          <span className="hint">
            Picked your nearest metro station &amp; bus hub ✓
            {nearStop &&
              ` · nearest bus stop: ${nearStop.name} (${nearStop.km < 1 ? `${Math.round(nearStop.km * 1000)} m` : `${nearStop.km} km`})`}
          </span>
        )}
        {locState === "error" && (
          <span className="hint">Location unavailable — pick manually below.</span>
        )}
      </div>
      {recents.length > 0 && (
        <div className="recent-plans">
          <span className="hint">{t("recent_label")}</span>
          {recents.map((r, i) => {
            const p = PLACES.find((x) => x.key === r.p);
            if (!p) return null;
            const usual = i === 0;
            return (
              <button
                key={`${r.p}-${r.s}`}
                className={`recent-chip ${usual ? "usual" : ""}`}
                title={usual ? t("usual_route") : undefined}
                onClick={() => {
                  setPlaceKey(r.p);
                  setStation(r.s);
                  if (r.h) setHubKey(r.h);
                }}
              >
                {usual ? "⭐ " : ""}
                {p.emoji} {p.name} · from {r.s}
              </button>
            );
          })}
        </div>
      )}

      <div className="plan-form">
        <label className="field">
          <span>{t("plan_where")}</span>
          <select value={placeKey} onChange={(e) => setPlaceKey(e.target.value)} id="plan-place">
            {PLACES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("plan_station")}</span>
          <input
            id="plan-station"
            list="station-options"
            value={station}
            placeholder={t("plan_station_ph")}
            autoComplete="off"
            onChange={(e) => setStation(e.target.value)}
          />
          <datalist id="station-options">
            {STATION_NAMES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>{t("plan_hub")}</span>
          <select value={hubKey} onChange={(e) => setHubKey(e.target.value)} id="plan-hub">
            <option value="">— choose a hub —</option>
            {BUS_HUBS.map((h) => (
              <option key={h.key} value={h.key}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Metro route ── */}
      <div className="result-block">
        <div className="result-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1 }}>
            🚇{" "}
            {returnTrip ? (
              <>Return: <b>{place.station}</b> → <b>{station || "…"}</b></>
            ) : (
              <>
                {t("by_metro_pre")}<b>{place.station}</b>{t("by_metro_post")}
              </>
            )}
          </span>
          {station && (
            <button
              className={`swap-btn ${returnTrip ? "on" : ""}`}
              onClick={() => setReturnTrip(!returnTrip)}
              title="Show the return journey"
            >
              ⇄ return trip
            </button>
          )}
        </div>
        {!station && <div className="hint">Pick your nearest metro station above to get the route.</div>}
        {station && segs === null && (
          <div className="hint">Couldn&apos;t find a route from that station.</div>
        )}
        {station && segs?.length === 0 && (
          <div className="hint">You&apos;re already at {place.station} — it&apos;s a walk away! 🚶</div>
        )}
        {station && segs && segs.length > 0 && (
          <div className="segs">
            {segs.map((s, i) => (
              <div className="seg" key={i}>
                <span className="seg-line" style={{ background: s.line.color, color: s.line.dark ? "#111" : "#fff" }}>
                  {s.line.name}
                </span>
                <span className="seg-txt">
                  {s.line.key === "walk" ? (
                    <>
                      Walk from <b>{s.board}</b> to <b>{s.alight}</b>
                    </>
                  ) : (
                    <>
                      {s.towards && s.towards !== s.alight && (
                        <>
                          towards <b>{s.towards}</b> ·{" "}
                        </>
                      )}
                      Board at <b>{s.board}</b> → alight at <b>{s.alight}</b>
                    </>
                  )}
                </span>
                <span className="seg-stops">
                  {s.line.key === "walk"
                    ? `walkway · ~${s.minutes} min`
                    : `${s.stops} stop${s.stops === 1 ? "" : "s"} · ~${s.minutes} min`}
                </span>
                {i < segs.length - 1 && <span className="seg-change">change</span>}
              </div>
            ))}
            {(() => {
              const est = journeyFareEstimate(segs);
              return (
                <div className="seg-total">
                  ⏱️ Door to door ≈ <b>{totalJourneyMinutes(segs)} min</b> · 🎫 ≈{" "}
                  <b>₹{est.fare}</b>
                  <span>
                    {" "}
                    · {est.km.toFixed(1)} km · scheduled run times + ~4 min per interchange ·
                    standard DMRC slab{est.airportPremium ? " (Airport Express premium extra)" : ""}
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Bus route ── */}
      <div className="result-block">
        <div className="result-title">🚌 {t("by_bus")}</div>
        {!hubKey && <div className="hint">Pick your nearest bus hub above to match live routes.</div>}
        {hubKey && busLoading && !bus && <div className="hint">Scanning live buses…</div>}
        {bus?.note && <div className="hint">{bus.note}</div>}
        {bus && bus.status === "live" && (
          <>
            {bus.data.common.length > 0 ? (
              <div className="bus-list">
                {bus.data.common.slice(0, 5).map((r) => (
                  <div className="bus-row" key={r.route}>
                    <span
                      className={`bus-no ${r.verified ? "" : "ref"}`}
                      title={r.verified ? "Official bus number" : "Feed route ref — number unconfirmed"}
                    >
                      {r.verified ? r.route : `ref ${r.route}`}
                    </span>
                    <span className="bus-meta">
                      {r.nearYou} live near you · {r.nearPlace} near {place.name}
                      {r.fare ? ` · ₹${r.fare[0]}–${r.fare[1]}` : ""}
                      {r.lastSeen ? ` · last seen ${fmtIst(r.lastSeen)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="hint">
                  No single route seen near both points in the last snapshot — routes active near{" "}
                  {place.name} right now:
                </div>
                <div className="bus-list">
                  {bus.data.nearPlace.slice(0, 5).map((r) => (
                    <div className="bus-row" key={r.route}>
                      <span
                        className={`bus-no ${r.verified ? "" : "ref"}`}
                        title={r.verified ? "Official bus number" : "Feed route ref — number unconfirmed"}
                      >
                        {r.verified ? r.route : `ref ${r.route}`}
                      </span>
                      <span className="bus-meta">
                        {r.nearPlace} live near {place.name}
                        {r.fare ? ` · ₹${r.fare[0]}–${r.fare[1]}` : ""}
                        {r.lastSeen ? ` · last seen ${fmtIst(r.lastSeen)}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="hint">
              Bold numbers are official bus numbers (OTD static GTFS); &quot;ref&quot; entries are
              live routes newer than the static snapshot. Matched from live GPS within ~
              {bus.data.radiusKm} km of both points. Typical DTC service hours: ~05:30–23:00
              IST — the open feed doesn&apos;t publish per-route timetables.
            </div>
          </>
        )}
      </div>

      {/* ── Events near the place ── */}
      <div className="result-block">
        <div className="result-title">
          🎫{" "}
          {nearbyEvents.citywide
            ? t("events_citywide")
            : `${t("events_pre")}${place.name}${t("events_post")}`}
        </div>
        {nearbyEvents.items.length === 0 && <div className="hint">No live events found right now.</div>}
        <div className="mini-events">
          {nearbyEvents.items.map(({ e, km }) => (
            <a
              key={e.id}
              className="mini-event"
              href={e.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mini-event-name">{e.name}</span>
              <span className="mini-event-meta">
                {e.dateLabel}
                {e.venue ? ` · ${e.venue}` : ""}
                {km != null ? ` · ${km.toFixed(1)} km away` : ""}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Restaurants ── */}
      <div className="result-block">
        <div className="result-title">
          🍽️ {t("food_pre")}{place.name}{t("food_post")}
        </div>
        <div className="rest-list">
          {place.restaurants.map((r) => (
            <RestaurantRow key={r.name} r={r} area={place.name} />
          ))}
        </div>
        <div className="hint" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {place.lineKeys.map(lineDot)} Nearest metro: <b>{place.station}</b>
        </div>
      </div>
    </Panel>
    </div>
  );
}
