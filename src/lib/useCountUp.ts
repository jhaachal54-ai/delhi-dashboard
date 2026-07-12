"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number from its previous value to the next whenever `value`
// changes, using an ease-out curve. Returns the current animated value.
export function useCountUp(value: number | null, durationMs = 900): number {
  const [display, setDisplay] = useState(value ?? 0);
  const fromRef = useRef(value ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value == null) return;
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    // requestAnimationFrame doesn't fire in hidden tabs — set the final value
    // directly so background tabs still show correct numbers.
    if (typeof document !== "undefined" && document.hidden) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return display;
}
