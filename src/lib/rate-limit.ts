import "server-only";
import { headers } from "next/headers";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Fixed-window rate limiting stored in Postgres (no extra service needed; works across
 * serverless instances). `hit` counts one attempt and says whether it is still allowed.
 */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} < now() then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count });
  // Occasionally sweep expired windows so the table stays small.
  if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()));
  return row.count <= limit;
}

/** Whether a key has already used up its limit in the current window (does not count an attempt). */
export async function isLimited(key: string, limit: number) {
  const row = await db.query.rateLimits.findFirst({
    where: and(eq(rateLimits.key, key), gt(rateLimits.resetAt, new Date())),
  });
  return (row?.count ?? 0) >= limit;
}

/** Every limit must allow the attempt (each one is counted). */
export async function hitAll(rules: { key: string; limit: number; windowSeconds: number }[]) {
  const results = await Promise.all(rules.map((r) => hit(r.key, r.limit, r.windowSeconds)));
  return results.every(Boolean);
}

/** The caller's IP address (Vercel and most proxies set x-forwarded-for / x-real-ip). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
