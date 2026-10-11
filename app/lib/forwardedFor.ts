/**
 * Headers that pass the visitor's IP on to the FastAPI backend, which uses it
 * for per-client rate limiting (see app/rate_limit.py). Without this every
 * request would appear to come from the Next.js server and share one limit.
 */
export function forwardedForHeaders(incoming: Headers): Record<string, string> {
  const ip =
    incoming.get("x-forwarded-for")?.split(",")[0].trim() ||
    incoming.get("x-real-ip")?.trim() ||
    "";
  return ip ? { "X-Forwarded-For": ip } : {};
}
