"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiEnvelope } from "./types";

export interface PollState<T> {
  data: ApiEnvelope<T> | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

// Polls a JSON endpoint on an interval, pausing while the tab is hidden so we
// don't hammer upstream feeds in a background tab. Always keeps the last good
// payload visible even if a later refresh fails.
export function usePolling<T>(url: string, intervalMs: number): PollState<T> {
  const [data, setData] = useState<ApiEnvelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as ApiEnvelope<T>;
      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const hasFetched = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      // Skip re-polls while the tab is hidden — but never skip the FIRST load,
      // and recheck cheaply so data resumes seconds after the tab is visible.
      if (typeof document !== "undefined" && document.hidden && hasFetched.current) {
        timer.current = setTimeout(tick, Math.min(intervalMs, 5000));
        return;
      }
      await fetchOnce();
      hasFetched.current = true;
      if (!cancelled) timer.current = setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fetchOnce, intervalMs]);

  return { data, loading, error, lastUpdated, refresh: fetchOnce };
}
