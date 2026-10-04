import "server-only";
import { headers } from "next/headers";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { rateLimitHits } from "@/db/schema";

/**
 * Database-backed rate limiting (works across serverless instances without extra services).
 * `isLimited` checks how many hits a key had inside the window; `recordHit` adds one.
 */
export async function isLimited(key: string, limit: number, windowMs: number) {
  const [row] = await db
    .select({ n: count() })
    .from(rateLimitHits)
    .where(and(eq(rateLimitHits.key, key), gt(rateLimitHits.createdAt, new Date(Date.now() - windowMs))));
  return (row?.n ?? 0) >= limit;
}

export async function recordHit(key: string) {
  await db.insert(rateLimitHits).values({ key });
  // Occasionally prune rows older than a day so the table stays small.
  if (Math.random() < 0.02) {
    await db.delete(rateLimitHits).where(lt(rateLimitHits.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  }
}

export async function clearHits(key: string) {
  await db.delete(rateLimitHits).where(eq(rateLimitHits.key, key));
}

/** The visitor's IP address as reported by the hosting proxy (Vercel sets x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
