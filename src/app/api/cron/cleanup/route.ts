import { timingSafeEqual } from "node:crypto";
import { and, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { emailVerifications, invitations, notifications, passwordResets, rateLimits, sessions } from "@/db/schema";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * GET /api/cron/cleanup — daily housekeeping (vercel.json → crons): expired sessions and tokens,
 * old notifications. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set the route refuses to run.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);
  const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const counts = await db.transaction(async (tx) => {
    const n = (rows: unknown[]) => rows.length;
    return {
      sessions: n(await tx.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id })),
      rateLimits: n(await tx.delete(rateLimits).where(lt(rateLimits.windowStart, dayAgo)).returning({ key: rateLimits.key })),
      // Notifications: read ones after 90 days, unread ones after about 13 months. (The activity
      // log is the workspace's history and is kept; it goes with the workspace when that's deleted.)
      notifications: n(
        await tx
          .delete(notifications)
          .where(or(and(isNotNull(notifications.readAt), lt(notifications.createdAt, quarterAgo)), lt(notifications.createdAt, yearAgo)))
          .returning({ id: notifications.id }),
      ),
      // Used or expired email-verification links.
      emailVerifications: n(
        await tx
          .delete(emailVerifications)
          .where(or(lt(emailVerifications.expiresAt, now), and(isNotNull(emailVerifications.usedAt), lt(emailVerifications.usedAt, dayAgo))))
          .returning({ id: emailVerifications.id }),
      ),
      passwordResets: n(
        await tx
          .delete(passwordResets)
          .where(or(lt(passwordResets.expiresAt, now), and(isNotNull(passwordResets.usedAt), lt(passwordResets.usedAt, dayAgo))))
          .returning({ id: passwordResets.id }),
      ),
      invitations: n(
        await tx
          .delete(invitations)
          .where(and(lt(invitations.expiresAt, monthAgo), or(isNull(invitations.acceptedAt), isNotNull(invitations.revokedAt))))
          .returning({ id: invitations.id }),
      ),
    };
  });
  console.info("[cron] cleanup", counts);
  return Response.json({ ok: true, ...counts });
}
