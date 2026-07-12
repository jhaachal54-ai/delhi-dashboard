"use client";

import { useCountUp } from "@/lib/useCountUp";

// Renders a number that smoothly counts up/down to its target on change.
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  fallback = "—",
}: {
  value: number | null;
  decimals?: number;
  suffix?: string;
  fallback?: string;
}) {
  const animated = useCountUp(value);
  if (value == null) return <>{fallback}</>;
  return (
    <>
      {animated.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}
