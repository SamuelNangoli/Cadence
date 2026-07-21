/**
 * Postgres-backed fixed-window rate limiter. Works across serverless instances
 * (each call is isolated, so in-memory counters don't), using the database the
 * app already has rather than a separate Redis service.
 */
import { NextResponse } from "next/server";
import { prisma } from "./db";

/** Best-effort client IP from proxy headers, falling back to a constant. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Allow up to `limit` hits per `windowMs` for a given action+key (e.g. an IP).
 * Returns { ok:false, retryAfter } once the window is exhausted.
 */
export async function rateLimit(
  action: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateResult> {
  const now = Date.now();
  const windowIndex = Math.floor(now / windowMs);
  const bucket = `${action}:${key}:${windowIndex}`;
  const expiresAt = new Date((windowIndex + 1) * windowMs);

  try {
    const row = await prisma.rateLimit.upsert({
      where: { bucket },
      create: { bucket, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    });

    // Opportunistic cleanup of long-expired buckets (~2% of calls).
    if (Math.random() < 0.02) {
      await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
    }

    if (row.count > limit) {
      return { ok: false, retryAfterSeconds: Math.ceil((expiresAt.getTime() - now) / 1000) };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch {
    // Fail open: a limiter outage must never lock everyone out of login.
    return { ok: true, retryAfterSeconds: 0 };
  }
}

/** Standard 429 response for an exhausted limit. */
export function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
