import { timingSafeEqual } from "node:crypto";
import { and, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { invitations, loginTokens, platformSessions, rateLimits, sessions, signups } from "@/db/schema";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * GET /api/cron/cleanup — daily housekeeping (vercel.json → crons). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set the route refuses to run.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const counts = await db.transaction(async (tx) => {
    const n = (rows: unknown[]) => rows.length;
    return {
      sessions: n(await tx.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id })),
      platformSessions: n(
        await tx.delete(platformSessions).where(lt(platformSessions.expiresAt, now)).returning({ id: platformSessions.id }),
      ),
      loginTokens: n(await tx.delete(loginTokens).where(lt(loginTokens.expiresAt, now)).returning({ id: loginTokens.tokenHash })),
      rateLimits: n(await tx.delete(rateLimits).where(lt(rateLimits.windowStart, dayAgo)).returning({ key: rateLimits.key })),
      // Abandoned sign-ups that never became a workspace.
      signups: n(
        await tx
          .delete(signups)
          .where(and(isNull(signups.orgId), lt(signups.expiresAt, now)))
          .returning({ id: signups.id }),
      ),
      // Provisioned sign-ups keep their record (serial audit trail) but not the password hash.
      scrubbed: n(
        await tx
          .update(signups)
          .set({ passwordHash: "" })
          .where(and(isNotNull(signups.orgId), lt(signups.expiresAt, now), sql`${signups.passwordHash} <> ''`))
          .returning({ id: signups.id }),
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
