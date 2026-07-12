"use client";

import { createContext, useContext } from "react";
import { REFRESH } from "./config";
import type {
  AirData,
  EventsData,
  RegionWx,
  TransitData,
  TrendData,
  WeatherData,
} from "./types";
import { usePolling, type PollState } from "./usePolling";

// One place that polls every feed exactly once and shares the results. This
// keeps the "should I head out?" score in sync with the panels and, crucially,
// avoids double-fetching the rate-limited events API.
interface Feeds {
  transit: PollState<TransitData>;
  air: PollState<AirData>;
  weather: PollState<WeatherData>;
  events: PollState<EventsData>;
  trend: PollState<TrendData>;
  regions: PollState<{ regions: RegionWx[] }>;
}

const FeedsContext = createContext<Feeds | null>(null);

export function FeedsProvider({ children }: { children: React.ReactNode }) {
  const transit = usePolling<TransitData>("/api/transit", REFRESH.transit);
  const air = usePolling<AirData>("/api/air", REFRESH.air);
  const weather = usePolling<WeatherData>("/api/weather", REFRESH.weather);
  const events = usePolling<EventsData>("/api/events", REFRESH.events);
  const trend = usePolling<TrendData>("/api/trend", REFRESH.trend);
  const regions = usePolling<{ regions: RegionWx[] }>("/api/regions", REFRESH.regions);

  return (
    <FeedsContext.Provider value={{ transit, air, weather, events, trend, regions }}>
      {children}
    </FeedsContext.Provider>
  );
}

export function useFeeds(): Feeds {
  const ctx = useContext(FeedsContext);
  if (!ctx) throw new Error("useFeeds must be used inside <FeedsProvider>");
  return ctx;
}
