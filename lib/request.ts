import type { NextRequest } from "next/server";
const buckets = new Map<string, { count: number; resetAt: number }>();
export function isAllowed(
  request: NextRequest,
  scope: string,
  limit = 8,
  windowMs = 60000
) {
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [key, bucket] of buckets)
      if (bucket.resetAt < now) buckets.delete(key);
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const key = scope + ":" + (forwarded ?? "local");
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    if (buckets.size > 20000) return false;
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count++;
  return true;
}
export function isTrustedMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    if (
      process.env.NODE_ENV === "development" &&
      new URL(origin).origin === new URL(request.url).origin
    )
      return true;
    return (
      new URL(origin).origin ===
      new URL(
        process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? request.url
      ).origin
    );
  } catch {
    return false;
  }
}
