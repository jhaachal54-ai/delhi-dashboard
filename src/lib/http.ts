// fetch() wrapper with a hard timeout. Public transit / events feeds routinely
// hang or take 10s+, and we never want a slow upstream to freeze a route handler.

export async function fetchWithTimeout(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...rest,
      signal: controller.signal,
      // These are proxied server-side and change constantly — never cache.
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}
